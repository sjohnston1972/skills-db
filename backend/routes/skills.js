const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/skills - List all main skills with their sub-skills
router.get('/', async (req, res) => {
    try {
        // Get all main skills scoped to the active department
        const mainSkillsResult = await db.query(
            'SELECT id, name, category, weight, skill_type, created_at FROM main_skills WHERE department_id = $1 ORDER BY name',
            [req.departmentId]
        );

        // Get all sub-skills scoped to the active department via join
        const subSkillsResult = await db.query(`
            SELECT ss.id, ss.name, ss.main_skill_id, ms.name as main_skill_name
            FROM sub_skills ss
            JOIN main_skills ms ON ss.main_skill_id = ms.id
            WHERE ms.department_id = $1
            ORDER BY ms.name, ss.name
        `, [req.departmentId]);

        // Group sub-skills by main skill
        const skillsMap = new Map();

        mainSkillsResult.rows.forEach(mainSkill => {
            skillsMap.set(mainSkill.id, {
                id: mainSkill.id,
                name: mainSkill.name,
                category: mainSkill.category,
                weight: mainSkill.weight,
                skillType: mainSkill.skill_type,
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

        // Get main skill scoped to the active department
        const mainSkillResult = await db.query(
            'SELECT id, name, category, weight, skill_type, created_at FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
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

// GET /api/skills/:id/sub-skills - Get sub-skills for a main skill
router.get('/:id/sub-skills', async (req, res) => {
    try {
        const { id } = req.params;

        // Get sub-skills
        const subSkillsResult = await db.query(
            'SELECT id, name FROM sub_skills WHERE main_skill_id = $1 ORDER BY name',
            [id]
        );

        res.json({
            success: true,
            data: subSkillsResult.rows
        });

    } catch (error) {
        console.error('Error fetching sub-skills:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/skills - Create new main skill
router.post('/', async (req, res) => {
    const client = await db.getClient();

    try {
        const { name, category, weight, skillType, subSkills } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                error: 'Skill name is required'
            });
        }

        // Validate weight (1-10)
        if (weight !== undefined && (weight < 1 || weight > 10)) {
            return res.status(400).json({
                success: false,
                error: 'Weight must be between 1 and 10'
            });
        }

        // Validate skillType
        if (skillType && !['technical', 'non-technical'].includes(skillType)) {
            return res.status(400).json({
                success: false,
                error: 'Skill type must be "technical" or "non-technical"'
            });
        }

        // Generate namespaced id from department slug + name
        const mainSkillId = `${req.departmentSlug}-` + name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

        await client.query('BEGIN');

        // Check if ID or name already exists within this department
        const existingResult = await client.query(
            'SELECT id FROM main_skills WHERE (id = $1 OR name = $2) AND department_id = $3',
            [mainSkillId, name, req.departmentId]
        );

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({
                success: false,
                error: 'Main skill with this ID or name already exists'
            });
        }

        // Insert new main skill with department_id
        const result = await client.query(
            'INSERT INTO main_skills (id, name, category, weight, skill_type, department_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, category, weight, skill_type, created_at',
            [mainSkillId, name, category || null, weight || 5, skillType || 'technical', req.departmentId]
        );

        // Insert sub-skills if provided
        if (subSkills && Array.isArray(subSkills) && subSkills.length > 0) {
            for (const subSkillName of subSkills) {
                if (subSkillName && typeof subSkillName === 'string') {
                    await client.query(
                        'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1, $2)',
                        [mainSkillId, subSkillName.trim()]
                    );
                }
            }
        }

        // Update metadata
        await client.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating main skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

// PUT /api/skills/:id - Update main skill
router.put('/:id', async (req, res) => {
    const client = await db.getClient();

    try {
        const { id } = req.params;
        const { name, category, weight, skillType, subSkills } = req.body;

        if (!name && category === undefined && weight === undefined && skillType === undefined && !subSkills) {
            return res.status(400).json({
                success: false,
                error: 'At least one field must be provided'
            });
        }

        // Validate weight if provided
        if (weight !== undefined && (weight < 1 || weight > 10)) {
            return res.status(400).json({
                success: false,
                error: 'Weight must be between 1 and 10'
            });
        }

        // Validate skillType if provided
        if (skillType && !['technical', 'non-technical'].includes(skillType)) {
            return res.status(400).json({
                success: false,
                error: 'Skill type must be "technical" or "non-technical"'
            });
        }

        await client.query('BEGIN');

        // Check if skill exists within this department
        const existingResult = await client.query(
            'SELECT id FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
        );

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
            });
        }

        // Update main skill
        const result = await client.query(
            'UPDATE main_skills SET name = COALESCE($1, name), category = COALESCE($2, category), weight = COALESCE($3, weight), skill_type = COALESCE($4, skill_type) WHERE id = $5 RETURNING id, name, category, weight, skill_type',
            [name || null, category !== undefined ? category : null, weight || null, skillType || null, id]
        );

        // Update sub-skills if provided. DIFF-based: only delete the ones that
        // were removed, only insert the ones that are new. Preserves existing
        // sub_skill rows (and therefore every resource's rating for them).
        //
        // (The old code was DELETE-all + INSERT-all, which cascaded into
        // resource_sub_skills and wiped every team rating for this skill.)
        if (subSkills && Array.isArray(subSkills)) {
            const desired = subSkills
                .filter(s => s && typeof s === 'string')
                .map(s => s.trim())
                .filter(Boolean);
            const desiredSet = new Set(desired);

            const currentResult = await client.query(
                'SELECT id, name FROM sub_skills WHERE main_skill_id = $1',
                [id]
            );
            const currentNames = new Set(currentResult.rows.map(r => r.name));

            // Delete only the sub-skills that are NOT in the desired list.
            // (Cascade still applies, but only for skills the user actually removed.)
            const toDelete = currentResult.rows.filter(r => !desiredSet.has(r.name));
            for (const row of toDelete) {
                await client.query('DELETE FROM sub_skills WHERE id = $1', [row.id]);
            }

            // Insert only the ones that don't already exist.
            for (const name of desired) {
                if (!currentNames.has(name)) {
                    await client.query(
                        'INSERT INTO sub_skills (main_skill_id, name) VALUES ($1, $2)',
                        [id, name]
                    );
                }
            }
        }

        // Update metadata
        await client.query(
            "UPDATE metadata SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = 'last_updated'",
            [new Date().toISOString()]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating main skill:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    } finally {
        client.release();
    }
});

// DELETE /api/skills/:id - Delete main skill (cascades to sub-skills and assignments)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if skill exists within this department
        const existingResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
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

        // Check if main skill exists within this department
        const mainSkillResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
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

        // Check if main skill exists within this department (guards cross-dept access)
        const mainSkillResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
        );

        if (mainSkillResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
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

        // Check if main skill exists within this department (guards cross-dept access)
        const mainSkillResult = await db.query(
            'SELECT id FROM main_skills WHERE id = $1 AND department_id = $2',
            [id, req.departmentId]
        );

        if (mainSkillResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Main skill not found'
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
