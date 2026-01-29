const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/skills - List all main skills with their sub-skills
router.get('/', async (req, res) => {
    try {
        // Get all main skills
        const mainSkillsResult = await db.query(
            'SELECT id, name, category, created_at FROM main_skills ORDER BY name'
        );

        // Get all sub-skills
        const subSkillsResult = await db.query(`
            SELECT ss.id, ss.name, ss.main_skill_id, ms.name as main_skill_name
            FROM sub_skills ss
            JOIN main_skills ms ON ss.main_skill_id = ms.id
            ORDER BY ms.name, ss.name
        `);

        // Group sub-skills by main skill
        const skillsMap = new Map();

        mainSkillsResult.rows.forEach(mainSkill => {
            skillsMap.set(mainSkill.id, {
                id: mainSkill.id,
                name: mainSkill.name,
                category: mainSkill.category,
                created_at: mainSkill.created_at,
                subSkills: []
            });
        });

        subSkillsResult.rows.forEach(subSkill => {
            const mainSkill = skillsMap.get(subSkill.main_skill_id);
            if (mainSkill) {
                mainSkill.subSkills.push({
                    id: subSkill.id,
                    name: subSkill.name
                });
            }
        });

        res.json({
            success: true,
            data: Array.from(skillsMap.values())
        });

    } catch (error) {
        console.error('Error fetching skills:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/skills/:id - Get single main skill with sub-skills
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get main skill
        const mainSkillResult = await db.query(
            'SELECT id, name, category, created_at FROM main_skills WHERE id = $1',
            [id]
        );

        if (mainSkillResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
            });
        }

        const mainSkill = mainSkillResult.rows[0];

        // Get sub-skills
        const subSkillsResult = await db.query(
            'SELECT id, name FROM sub_skills WHERE main_skill_id = $1 ORDER BY name',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...mainSkill,
                subSkills: subSkillsResult.rows
            }
        });

    } catch (error) {
        console.error('Error fetching skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/skills - Create new main skill
router.post('/', async (req, res) => {
    try {
        const { id, name, category } = req.body;

        if (!id || !name) {
            return res.status(400).json({
                success: false,
                error: 'Skill ID and name are required'
            });
        }

        // Check if ID or name already exists
        const existingResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1 OR name = $2',
            [id, name]
        );

        if (existingResult.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Main skill with this ID or name already exists'
            });
        }

        // Insert new main skill
        const result = await db.query(
            'INSERT INTO main_skills (id, name, category) VALUES ($1, $2, $3) RETURNING id, name, category, created_at',
            [id, name, category || null]
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
        console.error('Error creating main skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/skills/:id - Update main skill
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category } = req.body;

        if (!name && category === undefined) {
            return res.status(400).json({
                success: false,
                error: 'At least name or category must be provided'
            });
        }

        // Check if skill exists
        const existingResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
            });
        }

        // Update main skill
        const result = await db.query(
            'UPDATE main_skills SET name = COALESCE($1, name), category = COALESCE($2, category) WHERE id = $3 RETURNING id, name, category',
            [name || null, category !== undefined ? category : null, id]
        );

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating main skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/skills/:id - Delete main skill (cascades to sub-skills and assignments)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if skill exists
        const existingResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1',
            [id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
            });
        }

        // Delete main skill (cascades to sub_skills and resource_sub_skills)
        await db.query('DELETE FROM main_skills WHERE id = $1', [id]);

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.json({
            success: true,
            data: {
                message: 'Main skill deleted successfully (including all sub-skills and assignments)'
            }
        });

    } catch (error) {
        console.error('Error deleting main skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/skills/:id/sub-skills - Add sub-skill to a main skill
router.post('/:id/sub-skills', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Sub-skill name is required'
            });
        }

        // Check if main skill exists
        const mainSkillResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1',
            [id]
        );

        if (mainSkillResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
            });
        }

        // Check if sub-skill already exists for this main skill
        const existingSubSkill = await db.query(
            'SELECT id FROM sub_skills WHERE main_skill_id = $1 AND name = $2',
            [id, name]
        );

        if (existingSubSkill.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Sub-skill with this name already exists for this main skill'
            });
        }

        // Insert new sub-skill
        const result = await db.query(
            'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1, $2) RETURNING id, name',
            [id, name]
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
        console.error('Error creating sub-skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// PUT /api/skills/:id/sub-skills/:subSkillId - Update sub-skill name
router.put('/:id/sub-skills/:subSkillId', async (req, res) => {
    try {
        const { id, subSkillId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Sub-skill name is required'
            });
        }

        // Check if sub-skill exists and belongs to the main skill
        const existingResult = await db.query(
            'SELECT id FROM sub_skills WHERE id = $1 AND main_skill_id = $2',
            [subSkillId, id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sub-skill not found or does not belong to this main skill'
            });
        }

        // Update sub-skill
        const result = await db.query(
            'UPDATE sub_skills SET name = $1 WHERE id = $2 RETURNING id, name',
            [name, subSkillId]
        );

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating sub-skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/skills/:id/sub-skills/:subSkillId - Delete sub-skill (cascades to assignments)
router.delete('/:id/sub-skills/:subSkillId', async (req, res) => {
    try {
        const { id, subSkillId } = req.params;

        // Check if sub-skill exists and belongs to the main skill
        const existingResult = await db.query(
            'SELECT id FROM sub_skills WHERE id = $1 AND main_skill_id = $2',
            [subSkillId, id]
        );

        if (existingResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Sub-skill not found or does not belong to this main skill'
            });
        }

        // Delete sub-skill (cascades to resource_sub_skills)
        await db.query('DELETE FROM sub_skills WHERE id = $1', [subSkillId]);

        // Update metadata
        await db.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        res.json({
            success: true,
            data: {
                message: 'Sub-skill deleted successfully (including all resource assignments)'
            }
        });

    } catch (error) {
        console.error('Error deleting sub-skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
