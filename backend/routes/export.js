const express = require('express');
const router = express.Router();
const db = require('../db');
const { csvCell } = require('../lib/csv');

/**
 * GET /api/export/csv
 * Returns a wide CSV: one row per resource, one column per (main → sub) skill.
 * Suitable for pasting into Excel.
 */
router.get('/csv', async (req, res) => {
    try {
        const subs = (await db.query(`
            SELECT ss.id, ss.name AS sub_name, ms.name AS main_name
            FROM sub_skills ss
            JOIN main_skills ms ON ms.id = ss.main_skill_id
            WHERE ms.department_id = $1
            ORDER BY ms.name, ss.name
        `, [req.departmentId])).rows;

        const resources = (await db.query(
            `SELECT id, name, email FROM resources WHERE department_id = $1 ORDER BY name`,
            [req.departmentId]
        )).rows;

        const ratings = (await db.query(
            `SELECT resource_id, sub_skill_id, level FROM resource_sub_skills WHERE resource_id IN (SELECT id FROM resources WHERE department_id = $1)`,
            [req.departmentId]
        )).rows;

        const byResource = new Map();
        for (const row of ratings) {
            if (!byResource.has(row.resource_id)) byResource.set(row.resource_id, {});
            byResource.get(row.resource_id)[row.sub_skill_id] = row.level;
        }

        const header = ['Resource', 'Email', ...subs.map(s => `${s.main_name} :: ${s.sub_name}`)];
        const lines = [header.map(csvCell).join(',')];

        for (const r of resources) {
            const row = [r.name, r.email || ''];
            const levels = byResource.get(r.id) || {};
            for (const s of subs) {
                row.push(levels[s.id] !== undefined ? levels[s.id] : '');
            }
            lines.push(row.map(csvCell).join(','));
        }

        const csv = lines.join('\n');
        const filename = `skills-matrix-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (err) {
        console.error('export.csv error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
