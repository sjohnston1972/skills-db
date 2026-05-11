const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * POST /api/staffing/search
 * Body:
 *   {
 *     requirements: [{ mainSkill: "AWS", minLevel: 3 }, ...],
 *     mode: "match" | "one-away"
 *   }
 *
 * Returns resources whose computed main-skill level meets (mode="match")
 * or is one short of meeting (mode="one-away") every requirement.
 *
 * Main-skill level = average of the resource's sub-skill levels in that
 * main skill, rounded to nearest integer (same rule the dashboard uses).
 */
router.post('/search', async (req, res) => {
    try {
        const { requirements = [], mode = 'match' } = req.body || {};
        if (!Array.isArray(requirements) || requirements.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'requirements must be a non-empty array of {mainSkill, minLevel}',
            });
        }

        // Compute per-resource per-main-skill average levels in one SQL pass.
        const rows = (await db.query(`
            SELECT r.id AS resource_id, r.name, r.email,
                   ms.name AS main_skill,
                   COALESCE(ROUND(AVG(rss.level)::numeric)::int, 0) AS main_level,
                   COUNT(rss.level) AS rated_count
            FROM resources r
            CROSS JOIN main_skills ms
            LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
            LEFT JOIN resource_sub_skills rss
                   ON rss.sub_skill_id = ss.id AND rss.resource_id = r.id
            GROUP BY r.id, r.name, r.email, ms.name
        `)).rows;

        // Pivot rows → { resource: { skill: level } }
        const matrix = new Map();
        for (const row of rows) {
            if (!matrix.has(row.resource_id)) {
                matrix.set(row.resource_id, {
                    id: row.resource_id,
                    name: row.name,
                    email: row.email,
                    levels: {},
                });
            }
            matrix.get(row.resource_id).levels[row.main_skill] = Number(row.main_level);
        }

        const results = [];
        for (const r of matrix.values()) {
            const gaps = [];
            let meetsAll = true;
            let oneAway = 0;
            for (const req of requirements) {
                const have = r.levels[req.mainSkill] || 0;
                const need = Number(req.minLevel) || 0;
                if (have < need) {
                    meetsAll = false;
                    gaps.push({ mainSkill: req.mainSkill, have, need, delta: need - have });
                    if (need - have === 1) oneAway += 1;
                }
            }

            if (mode === 'match' && meetsAll) {
                results.push({ ...r, fullyMeets: true, gaps: [] });
            } else if (mode === 'one-away' && !meetsAll && gaps.length === oneAway && gaps.length <= Math.max(1, Math.floor(requirements.length / 2))) {
                // "One-away" = every shortfall is exactly 1 level, and shortfalls cover at most half the requirements
                results.push({ ...r, fullyMeets: false, gaps });
            }
        }

        // Sort: full matches by total surplus; one-away by fewest gaps
        results.sort((a, b) => {
            if (a.fullyMeets && !b.fullyMeets) return -1;
            if (!a.fullyMeets && b.fullyMeets) return 1;
            return a.gaps.length - b.gaps.length;
        });

        res.json({ success: true, data: results });
    } catch (err) {
        console.error('staffing.search error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
