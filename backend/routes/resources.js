const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Helper function to calculate main skill level from sub-skills
function calculateMainSkillLevel(subSkills) {
    if (!subSkills || Object.keys(subSkills).length === 0) return 0;

    const levels = Object.values(subSkills);
    const sum = levels.reduce((acc, level) => acc + level, 0);
    return Math.round(sum / levels.length);
}

// GET /api/resources - List all resources
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, email, job_role, created_at, updated_at FROM resources ORDER BY name'
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/resources/:id - Get single resource with skills
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get resource
        const resourceResult = await db.query(
            'SELECT id, name, email, job_role FROM resources WHERE id = $1',
            [id]
        );

        if (resourceResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }

        const resource = resourceResult.rows[0];

        // Get resource's skill levels
        const mappingsResult = await db.query(`
            SELECT rss.sub_skill_id, rss.level, rss.last_assessed_at,
                   ss.name as sub_skill_name, ss.main_skill_id,
                   ms.name as main_skill_name
            FROM resource_sub_skills rss
            JOIN sub_skills ss ON rss.sub_skill_id = ss.id
            JOIN main_skills ms ON ss.main_skill_id = ms.id
            WHERE rss.resource_id = $1
            ORDER BY ms.name, ss.name
        `, [id]);

        // Build skills structure
        const subSkills = {};
        const skills = {};
        const lastAssessed = {}; // mainSkillName -> { subSkillName -> ISO timestamp }

        mappingsResult.rows.forEach(mapping => {
            const mainSkillName = mapping.main_skill_name;

            if (!subSkills[mainSkillName]) {
                subSkills[mainSkillName] = {};
                lastAssessed[mainSkillName] = {};
            }

            subSkills[mainSkillName][mapping.sub_skill_name] = mapping.level;
            lastAssessed[mainSkillName][mapping.sub_skill_name] = mapping.last_assessed_at;
        });

        // Calculate main skill levels
        Object.keys(subSkills).forEach(mainSkillName => {
            skills[mainSkillName] = calculateMainSkillLevel(subSkills[mainSkillName]);
        });

        res.json({
            success: true,
            data: {
                ...resource,
                skills: skills,
                subSkills: subSkills,
                lastAssessed: lastAssessed
            }
        });

    } catch (error) {
        console.error('Error fetching resource:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/resources - Create new resource
router.post('/', async (req, res) => {
    try {
        const { id, name, email, password, job_role } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                success: false,
                error: 'Resource ID and name are required'
            });
        }

        // Hash password if provided
        let passwordHash = null;
        if (password) {
            passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }

        // Check if ID already exists
        const existingResult = await db.query(
            'SELECT id FROM resources WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Resource with this ID already exists'
            });
        }

        // Insert new resource
        const result = await db.query(
            'INSERT INTO resources (id, name, email, password_hash, job_role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, job_role, created_at',
            [id, name, email || null, passwordHash, job_role || null]
        );

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/resources/:id - Update resource and skill levels
router.put('/:id', async (req, res) => {
    const client = await db.getClient();

    try {
        const { id } = req.params;
        const { name, email, password, subSkills, job_role } = req.body;

        await client.query('BEGIN');

        // Hash new password if provided
        let passwordHash = undefined;
        if (password) {
            passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        }

        // Check if resource exists
        const existingResult = await client.query(
            'SELECT id FROM resources WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }

        // Update resource basic info
        if (name || email !== undefined || passwordHash !== undefined || job_role !== undefined) {
            await client.query(
                `UPDATE resources
                 SET name          = COALESCE($1, name),
                     email         = COALESCE($2, email),
                     password_hash = COALESCE($3, password_hash),
                     job_role      = COALESCE($4, job_role),
                     updated_at    = CURRENT_TIMESTAMP
                 WHERE id = $5`,
                [name || null, email !== undefined ? email : null, passwordHash, job_role || null, id]
            );
        }

        // Update sub-skill levels if provided. DIFF-based: only touch ratings
        // that actually change. Preserves last_assessed_at on untouched ratings
        // and means a stale cache can't wipe a resource's data by sending a
        // partial subSkills object.
        if (subSkills) {
            // Build the desired (sub_skill_id → level) set from the payload.
            const desired = new Map();
            const unknownPairs = [];
            for (const [mainSkillName, subSkillsObj] of Object.entries(subSkills)) {
                for (const [subSkillName, level] of Object.entries(subSkillsObj || {})) {
                    const lvl = parseInt(level, 10);
                    if (!Number.isFinite(lvl) || lvl < 0 || lvl > 5) continue;
                    if (lvl === 0) continue; // 0 = no rating, don't store
                    const r = await client.query(`
                        SELECT ss.id FROM sub_skills ss
                        JOIN main_skills ms ON ss.main_skill_id = ms.id
                        WHERE ms.name = $1 AND ss.name = $2
                    `, [mainSkillName, subSkillName]);
                    if (r.rows.length > 0) {
                        desired.set(r.rows[0].id, lvl);
                    } else {
                        unknownPairs.push(`${mainSkillName} :: ${subSkillName}`);
                    }
                }
            }
            if (unknownPairs.length) {
                console.warn(`Sub-skills not found for resource ${id}:`, unknownPairs.slice(0, 5));
            }

            // Read current ratings.
            const currentRows = (await client.query(
                'SELECT sub_skill_id, level FROM resource_sub_skills WHERE resource_id = $1',
                [id]
            )).rows;
            const current = new Map(currentRows.map(r => [r.sub_skill_id, r.level]));

            // Delete any ratings no longer in the payload.
            for (const subSkillId of current.keys()) {
                if (!desired.has(subSkillId)) {
                    await client.query(
                        'DELETE FROM resource_sub_skills WHERE resource_id = $1 AND sub_skill_id = $2',
                        [id, subSkillId]
                    );
                }
            }
            // Insert or update ratings that changed.
            for (const [subSkillId, lvl] of desired.entries()) {
                if (!current.has(subSkillId)) {
                    await client.query(
                        'INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level, last_assessed_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                        [id, subSkillId, lvl]
                    );
                } else if (current.get(subSkillId) !== lvl) {
                    await client.query(
                        'UPDATE resource_sub_skills SET level = $1, last_assessed_at = CURRENT_TIMESTAMP WHERE resource_id = $2 AND sub_skill_id = $3',
                        [lvl, id, subSkillId]
                    );
                }
                // else: unchanged, leave last_assessed_at alone
            }
        }

        // Update metadata
        await client.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        await client.query('COMMIT');

        // Fetch and return updated resource
        const updatedResult = await db.query(
            'SELECT id, name, email, updated_at FROM resources WHERE id = $1',
            [id]
        );

        res.json({
            success: true,
            data: updatedResult.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating resource:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

// DELETE /api/resources/:id - Delete resource
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if resource exists
        const existingResult = await db.query(
            'SELECT id FROM resources WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Resource not found'
            });
        }

        // Delete resource (cascades to resource_sub_skills)
        await db.query('DELETE FROM resources WHERE id = $1', [id]);

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.json({
            success: true,
            data: {
                message: 'Resource deleted successfully'
            }
        });

    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
