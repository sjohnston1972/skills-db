const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/data-quality
 *
 * Surfaces data-hygiene issues an admin can act on:
 *   - resources with zero ratings
 *   - resources missing email/username (cannot log in)
 *   - main skills with no sub-skills (orphan skills)
 *   - stale ratings (>365 days)
 *
 * Returns a structured summary.
 */
router.get('/', async (req, res) => {
    try {
        const staleDays = Number(req.query.staleDays) || 365;

        const expiringWindow = Math.max(1, Math.min(365, parseInt(req.query.expiringWindow, 10) || 90));
        const [noSkills, noEmail, orphanSkills, staleRatings, expiringCerts] = await Promise.all([
            db.query(`
                SELECT r.id, r.name
                FROM resources r
                LEFT JOIN resource_sub_skills rss ON rss.resource_id = r.id
                WHERE r.department_id = $1
                GROUP BY r.id, r.name
                HAVING COUNT(rss.level) = 0
                ORDER BY r.name
            `, [req.departmentId]),
            db.query(`SELECT id, name FROM resources WHERE (email IS NULL OR email = '') AND department_id = $1 ORDER BY name`, [req.departmentId]),
            db.query(`
                SELECT ms.id, ms.name, ms.weight, ms.skill_type AS "skillType"
                FROM main_skills ms
                LEFT JOIN sub_skills ss ON ss.main_skill_id = ms.id
                WHERE ms.department_id = $1
                GROUP BY ms.id, ms.name, ms.weight, ms.skill_type
                HAVING COUNT(ss.id) = 0
                ORDER BY ms.name
            `, [req.departmentId]),
            db.query(`
                SELECT r.id AS resource_id, r.name AS resource_name,
                       ms.name AS main_skill, ss.name AS sub_skill, rss.level,
                       rss.last_assessed_at,
                       EXTRACT(DAY FROM (CURRENT_TIMESTAMP - rss.last_assessed_at))::int AS days_old
                FROM resource_sub_skills rss
                JOIN resources r ON r.id = rss.resource_id
                JOIN sub_skills ss ON ss.id = rss.sub_skill_id
                JOIN main_skills ms ON ms.id = ss.main_skill_id
                WHERE r.department_id = $1
                  AND rss.last_assessed_at < CURRENT_TIMESTAMP - ($2 || ' days')::interval
                ORDER BY rss.last_assessed_at ASC
                LIMIT 200
            `, [req.departmentId, staleDays]),
            db.query(`
                SELECT rt.id, rt.resource_id, rt.expiry_date, rt.status,
                       r.name AS resource_name,
                       t.name AS training_name, t.code AS training_code, t.vendor,
                       (rt.expiry_date - CURRENT_DATE) AS days_until_expiry
                FROM resource_trainings rt
                JOIN resources r ON r.id = rt.resource_id
                JOIN trainings t ON t.id = rt.training_id
                WHERE r.department_id = $1
                  AND rt.expiry_date IS NOT NULL
                  AND rt.expiry_date <= CURRENT_DATE + ($2 || ' days')::interval
                  AND rt.status IN ('achieved', 'in-progress')
                ORDER BY rt.expiry_date ASC
            `, [req.departmentId, expiringWindow]),
        ]);

        res.json({
            success: true,
            data: {
                resourcesWithNoSkills: noSkills.rows,
                resourcesWithNoEmail: noEmail.rows,
                emptyMainSkills: orphanSkills.rows,
                staleRatings: staleRatings.rows,
                staleDaysThreshold: staleDays,
                expiringCerts: expiringCerts.rows,
                expiringWindow,
                summary: {
                    noSkillsCount: noSkills.rows.length,
                    noEmailCount: noEmail.rows.length,
                    emptySkillCount: orphanSkills.rows.length,
                    staleRatingCount: staleRatings.rows.length,
                    expiringCertCount: expiringCerts.rows.length,
                },
            },
        });
    } catch (err) {
        console.error('dataquality error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
