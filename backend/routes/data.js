const express = require('express');
const router = express.Router();
const db = require('../db');
const { calculateMainSkillLevel } = require('../lib/skill-levels');
const { verifyAdminAuth } = require('../middleware/auth');
const { applyMigrations } = require('../lib/migrations');

// Build the complete export payload for one department — shared by GET /
// and POST /export so the two can never drift apart (#19).
async function buildExportPayload(departmentId) {
    // Get all resources
    const resourcesResult = await db.query(
        'SELECT id, name, email, job_role FROM resources WHERE department_id = $1 ORDER BY name', [departmentId]
    );

    // Get all main skills
    const mainSkillsResult = await db.query(
        'SELECT id, name, category, weight, skill_type FROM main_skills WHERE department_id = $1 ORDER BY name', [departmentId]
    );

    // Get all sub-skills
    const subSkillsResult = await db.query(`
        SELECT ss.id, ss.name, ss.main_skill_id, ms.name as main_skill_name
        FROM sub_skills ss
        JOIN main_skills ms ON ss.main_skill_id = ms.id
        WHERE ms.department_id = $1
        ORDER BY ms.name, ss.name
    `, [departmentId]);

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
    `, [departmentId]);

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

    return {
        resources: resources,
        skills: skills,
        lastUpdated: lastUpdated,
        metadata: {
            lastUpdated: lastUpdated,
            version: '3.0',
            source: 'PostgreSQL Database'
        }
    };
}

function importError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// Validate an import payload before any DB work. Throws {status: 400}
// errors; returns the normalised { resources, skills } pair.
function validateImportPayload(body) {
    const resources = body && body.resources;
    if (!resources || !Array.isArray(resources)) {
        throw importError(400, 'Invalid data format: resources array required');
    }
    for (const r of resources) {
        if (!r || typeof r.id !== 'string' || !r.id || typeof r.name !== 'string' || !r.name) {
            throw importError(400, 'Each resource needs a string id and name');
        }
        if (r.subSkills != null) {
            if (typeof r.subSkills !== 'object' || Array.isArray(r.subSkills)) {
                throw importError(400, `Invalid subSkills for resource ${r.id}`);
            }
            for (const [main, subs] of Object.entries(r.subSkills)) {
                if (subs == null || typeof subs !== 'object' || Array.isArray(subs)) {
                    throw importError(400, `Invalid subSkills for resource ${r.id} / ${main}`);
                }
                for (const [sub, level] of Object.entries(subs)) {
                    if (!Number.isInteger(level) || level < 0 || level > 5) {
                        throw importError(400,
                            `Invalid level for ${r.id} / ${main} / ${sub}: must be an integer 0-5`);
                    }
                }
            }
        }
    }
    const skills = Array.isArray(body.skills) ? body.skills : [];
    for (const s of skills) {
        if (!s || typeof s.name !== 'string' || !s.name) {
            throw importError(400, 'Each skills[] entry needs a name');
        }
        if (s.weight != null && (!Number.isInteger(s.weight) || s.weight < 1 || s.weight > 10)) {
            throw importError(400, `Invalid weight for skill ${s.name}: must be an integer 1-10`);
        }
        if (s.skillType != null && !['technical', 'non-technical'].includes(s.skillType)) {
            throw importError(400, `Invalid skillType for skill ${s.name}`);
        }
    }
    return { resources, skills };
}

// Import a payload into one department, losslessly (#16 #17 #18):
//   - skills catalogue (category/weight/skill_type) is taken from skills[]
//     when present; skills only mentioned in resources' ratings get defaults
//     (legacy payloads).
//   - resources are UPSERTed, so password_hash and training assignments
//     survive; only people absent from the payload are deleted.
//   - ratings keep their payload lastAssessed timestamps when valid.
// Shared by POST / and POST /import (#19).
async function importData(body, departmentId, departmentSlug) {
    const { resources, skills } = validateImportPayload(body);
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // Replace semantics for ratings and the skills catalogue only —
        // resources (and their trainings) are upserted below, not wiped.
        await client.query(
            `DELETE FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`, [departmentId]);
        await client.query(
            `DELETE FROM sub_skills WHERE main_skill_id IN (SELECT id FROM main_skills WHERE department_id = $1)`, [departmentId]);
        await client.query(`DELETE FROM main_skills WHERE department_id = $1`, [departmentId]);

        const slugify = name =>
            `${departmentSlug}-` + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        // Main skills: catalogue entries first (they carry the metadata)...
        const mainSkillIds = new Map(); // name -> id
        for (const s of skills) {
            const id = (typeof s.id === 'string' && s.id) ? s.id : slugify(s.name);
            mainSkillIds.set(s.name, id);
            await client.query(
                `INSERT INTO main_skills (id, name, category, weight, skill_type, department_id)
                 VALUES ($1, $2, $3, COALESCE($4, 5), COALESCE($5, 'technical'), $6)`,
                [id, s.name, s.category ?? null, s.weight ?? null, s.skillType ?? null, departmentId]
            );
        }
        // ...then any skill only seen in resources' ratings (legacy payloads).
        for (const r of resources) {
            for (const main of Object.keys(r.subSkills || {})) {
                if (!mainSkillIds.has(main)) {
                    const id = slugify(main);
                    mainSkillIds.set(main, id);
                    await client.query(
                        'INSERT INTO main_skills (id, name, department_id) VALUES ($1, $2, $3)',
                        [id, main, departmentId]
                    );
                }
            }
        }

        // Sub-skills: union of the catalogue's and the ones with ratings.
        const subNamesByMain = new Map(); // mainName -> Set(subName)
        const addSub = (main, sub) => {
            if (!sub) return;
            if (!subNamesByMain.has(main)) subNamesByMain.set(main, new Set());
            subNamesByMain.get(main).add(sub);
        };
        for (const s of skills) {
            for (const ss of (Array.isArray(s.subSkills) ? s.subSkills : [])) {
                addSub(s.name, typeof ss === 'string' ? ss : ss && ss.name);
            }
        }
        for (const r of resources) {
            for (const [main, subs] of Object.entries(r.subSkills || {})) {
                for (const sub of Object.keys(subs)) addSub(main, sub);
            }
        }

        const subSkillIds = new Map(); // `${mainName}_${subName}` -> id
        for (const [main, subs] of subNamesByMain.entries()) {
            const mainSkillId = mainSkillIds.get(main);
            for (const sub of subs) {
                const result = await client.query(
                    'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1, $2) RETURNING id',
                    [mainSkillId, sub]
                );
                subSkillIds.set(`${main}_${sub}`, result.rows[0].id);
            }
        }

        // Resources: UPSERT keeps password_hash and (via no delete) the
        // resource_trainings rows. job_role only overwrites when the payload
        // actually carries one, so legacy exports don't null it out.
        for (const r of resources) {
            await client.query(
                `INSERT INTO resources (id, name, email, job_role, department_id)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (id) DO UPDATE SET
                     name = EXCLUDED.name,
                     email = EXCLUDED.email,
                     job_role = COALESCE(EXCLUDED.job_role, resources.job_role),
                     department_id = EXCLUDED.department_id,
                     updated_at = CURRENT_TIMESTAMP`,
                [r.id, r.name, r.email || null, r.job_role || null, departmentId]
            );
        }
        // People absent from the payload are removed (their ratings and
        // trainings cascade away) — import stays a full replace of "who's
        // on the team" without nuking everyone's related rows first.
        await client.query(
            `DELETE FROM resources WHERE department_id = $1 AND NOT (id = ANY($2))`,
            [departmentId, resources.map(r => r.id)]
        );

        // Ratings, preserving last-assessed timestamps when supplied.
        for (const r of resources) {
            for (const [main, subs] of Object.entries(r.subSkills || {})) {
                for (const [sub, level] of Object.entries(subs)) {
                    const subSkillId = subSkillIds.get(`${main}_${sub}`);
                    if (!subSkillId) continue;

                    let assessed = null;
                    const raw = r.lastAssessed && r.lastAssessed[main] && r.lastAssessed[main][sub];
                    if (raw) {
                        const d = new Date(raw);
                        if (!isNaN(d.getTime())) assessed = d;
                    }
                    await client.query(
                        `INSERT INTO resource_sub_skills (resource_id, sub_skill_id, level, last_assessed_at)
                         VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))`,
                        [r.id, subSkillId, level, assessed]
                    );
                }
            }
        }

        // Update metadata
        await client.query(
            "INSERT INTO metadata (key, value, updated_at) VALUES ('last_updated', $1, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP",
            [new Date().toISOString()]
        );

        await client.query('COMMIT');

        return {
            message: 'Data saved successfully',
            resourcesCount: resources.length,
            preservedTrainings: true
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// GET /api/data - Return complete data in localStorage format
router.get('/', async (req, res) => {
    try {
        res.json({ success: true, data: await buildExportPayload(req.departmentId) });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/data and POST /api/data/import - Save/Update complete data.
// Same handler for both paths — no router.handle() re-dispatch (#19).
async function importHandler(req, res) {
    try {
        const summary = await importData(req.body, req.departmentId, req.departmentSlug);
        res.json({ success: true, data: summary });
    } catch (error) {
        const status = error.status || 500;
        if (status >= 500) console.error('Error saving data:', error);
        res.status(status).json({
            success: false,
            error: error.message
        });
    }
}
router.post('/', importHandler);
router.post('/import', importHandler);

// POST /api/data/export - Export data as downloadable JSON
router.post('/export', async (req, res) => {
    try {
        const data = await buildExportPayload(req.departmentId);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=skills-matrix-export.json');
        res.json({ success: true, data });

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
