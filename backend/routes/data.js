const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateMainSkillLevel } = require('../lib/skill-levels');
const { verifyAdminAuth } = require('../middleware/auth');
const { applyMigrations } = require('../lib/migrations');

// GET /api/data - Return complete data in localStorage format
router.get('/', async (req, res) => {
    try {
        // Get all resources
        const resourcesResult = await db.query(
            'SELECT id, name, email, job_role FROM resources WHERE department_id = $1 ORDER BY name', [req.departmentId]
        );

        // Get all main skills
        const mainSkillsResult = await db.query(
            'SELECT id, name, category, weight, skill_type FROM main_skills WHERE department_id = $1 ORDER BY name', [req.departmentId]
        );

        // Get all sub-skills
        const subSkillsResult = await db.query(`
            SELECT ss.id, ss.name, ss.main_skill_id, ms.name as main_skill_name
            FROM sub_skills ss
            JOIN main_skills ms ON ss.main_skill_id = ms.id
            WHERE ms.department_id = $1
            ORDER BY ms.name, ss.name
        `, [req.departmentId]);

        // Get all resource-sub-skill mappings
        const mappingsResult = await db.query(`
            SELECT rss.resource_id, rss.sub_skill_id, rss.level, rss.last_assessed_at,
                   ss.name as sub_skill_name, ss.main_skill_id,
                   ms.name as main_skill_name
            FROM resource_sub_skills rss
            JOIN sub_skills ss ON rss.sub_skill_id = ss.id
            JOIN main_skills ms ON ss.main_skill_id = ms.id
            WHERE ms.department_id = $1
            ORDER BY rss.resource_id, ms.name, ss.name
        `, [req.departmentId]);

        // Build the data structure
        const resources = resourcesResult.rows.map(resource => {
            // Get all mappings for this resource
            const resourceMappings = mappingsResult.rows.filter(
                m => m.resource_id === resource.id
            );

            // Group sub-skills by main skill (+ capture last-assessed timestamps)
            const subSkills = {};
            const lastAssessed = {};

            resourceMappings.forEach(mapping => {
                const mainSkillName = mapping.main_skill_name;

                if (!subSkills[mainSkillName]) {
                    subSkills[mainSkillName] = {};
                    lastAssessed[mainSkillName] = {};
                }

                subSkills[mainSkillName][mapping.sub_skill_name] = mapping.level;
                lastAssessed[mainSkillName][mapping.sub_skill_name] = mapping.last_assessed_at;
            });

            // Calculate main skill levels from sub-skills
            const skills = {};
            Object.keys(subSkills).forEach(mainSkillName => {
                skills[mainSkillName] = calculateMainSkillLevel(subSkills[mainSkillName]);
            });

            return {
                id: resource.id,
                name: resource.name,
                email: resource.email,
                job_role: resource.job_role,
                skills: skills,
                subSkills: subSkills,
                lastAssessed: lastAssessed
            };
        });

        // Build skills array for frontend
        const skills = mainSkillsResult.rows.map(mainSkill => {
            // Get sub-skills for this main skill as {id, name} objects
            const mainSkillSubSkills = subSkillsResult.rows
                .filter(ss => ss.main_skill_id === mainSkill.id)
                .map(ss => ({ id: ss.id, name: ss.name }));

            return {
                id: mainSkill.id,
                name: mainSkill.name,
                category: mainSkill.category,
                weight: mainSkill.weight,
                skillType: mainSkill.skill_type,
                subSkills: mainSkillSubSkills
            };
        });

        // Get metadata
        const metadataResult = await db.query(
            "SELECT value FROM metadata WHERE key = 'last_updated'"
        );
        const lastUpdated = metadataResult.rows[0]?.value || new Date().toISOString();

        res.json({
            success: true,
            data: {
                resources: resources,
                skills: skills,
                lastUpdated: lastUpdated,
                metadata: {
                    lastUpdated: lastUpdated,
                    version: '3.0',
                    source: 'PostgreSQL Database'
                }
            }
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/data - Save/Update complete data
router.post('/', async (req, res) => {
    const client = await db.getClient();

    try {
        const { resources } = req.body;

        if (!resources || !Array.isArray(resources)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format: resources array required'
            });
        }

        await client.query('BEGIN');

        // Clear existing data for this department only
        const deptId = req.departmentId;
        await client.query(
            `DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [deptId]);
        await client.query(`DELETE FROM resources WHERE department_id = $1`, [deptId]);
        await client.query(
            `DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [deptId]);
        await client.query(`DELETE FROM main_skills WHERE department_id = $1`, [deptId]);

        // Collect all unique main skills and sub-skills
        const mainSkillsSet = new Set();
        const subSkillsMap = new Map(); // mainSkillName -> Set of subSkillNames

        resources.forEach(resource => {
            if (resource.subSkills) {
                Object.keys(resource.subSkills).forEach(mainSkillName => {
                    mainSkillsSet.add(mainSkillName);

                    if (!subSkillsMap.has(mainSkillName)) {
                        subSkillsMap.set(mainSkillName, new Set());
                    }

                    Object.keys(resource.subSkills[mainSkillName]).forEach(subSkillName => {
                        subSkillsMap.get(mainSkillName).add(subSkillName);
                    });
                });
            }
        });

        // Insert main skills
        const mainSkillIds = new Map(); // name -> id
        for (const mainSkillName of mainSkillsSet) {
            const mainSkillId = `${req.departmentSlug}-` + mainSkillName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            mainSkillIds.set(mainSkillName, mainSkillId);

            await client.query(
                'INSERT INTO main_skills (id, name, department_id) VALUES ($1, $2, $3)',
                [mainSkillId, mainSkillName, req.departmentId]
            );
        }

        // Insert sub-skills
        const subSkillIds = new Map(); // mainSkillName_subSkillName -> id
        for (const [mainSkillName, subSkillNames] of subSkillsMap.entries()) {
            const mainSkillId = mainSkillIds.get(mainSkillName);

            for (const subSkillName of subSkillNames) {
                const result = await client.query(
                    'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1, $2) RETURNING id',
                    [mainSkillId, subSkillName]
                );

                const key = `${mainSkillName}_${subSkillName}`;
                subSkillIds.set(key, result.rows[0].id);
            }
        }

        // Insert resources and their skill levels
        for (const resource of resources) {
            // Insert resource
            await client.query(
                'INSERT INTO resources (id, name, email, department_id) VALUES ($1, $2, $3, $4)',
                [resource.id, resource.name, resource.email || null, req.departmentId]
            );

            // Insert resource sub-skill levels
            if (resource.subSkills) {
                for (const [mainSkillName, subSkills] of Object.entries(resource.subSkills)) {
                    for (const [subSkillName, level] of Object.entries(subSkills)) {
                        const key = `${mainSkillName}_${subSkillName}`;
                        const subSkillId = subSkillIds.get(key);

                        if (subSkillId) {
                            await client.query(
                                'INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level) VALUES ($1, $2, $3)',
                                [resource.id, subSkillId, level]
                            );
                        }
                    }
                }
            }
        }

        // Update metadata
        await client.query(
            "INSERT INTO metadata (key, value, updated_at) VALUES ('last_updated', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
            [new Date().toISOString()]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            data: {
                message: 'Data saved successfully',
                resourcesCount: resources.length
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

// POST /api/data/import - Import data from JSON (alias for POST /)
router.post('/import', async (req, res) => {
    return router.handle({ ...req, method: 'POST', url: '/' }, res);
});

// POST /api/data/export - Export data as downloadable JSON
router.post('/export', async (req, res) => {
    try {
        // Reuse GET / logic
        const dataResponse = await new Promise((resolve, reject) => {
            router.handle({ ...req, method: 'GET', url: '/' }, {
                json: resolve,
                status: () => ({ json: reject })
            });
        });

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=skills-matrix-export.json');
        res.json(dataResponse);

    } catch (error) {
        console.error('Error exporting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/data/reset - Reset to sample data.
// Destructive: rebuilds the whole schema. Admin-only (#12) and requires an
// explicit confirmation token so a stray curl can't wipe the database.
router.post('/reset', verifyAdminAuth, async (req, res) => {
    try {
        if (!req.body || req.body.confirm !== 'RESET') {
            return res.status(400).json({
                success: false,
                error: 'Reset is destructive. Send body { "confirm": "RESET" } to proceed.'
            });
        }

        const ok = await db.initDatabase();
        if (!ok) {
            return res.status(500).json({
                success: false,
                error: 'Database re-initialisation failed — see server logs.'
            });
        }

        // init-db.sql rebuilds the pre-department schema; re-apply migrations
        // so department tables/columns exist again and the app stays usable.
        const { failed } = await applyMigrations(db.query);
        if (failed.length) {
            return res.status(500).json({
                success: false,
                error: `Reset ran but migrations failed: ${failed.map(f => `${f.file} (${f.error})`).join('; ')}`
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Database reset successfully'
            }
        });

    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
