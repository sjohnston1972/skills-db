const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/trainings — list catalogue
router.get('/', async (req, res) => {
    try {
        const r = await db.query(
            'SELECT id, name, code, vendor, category, type, description, created_at FROM trainings WHERE department_id = $1 ORDER BY vendor, name',
            [req.departmentId]
        );
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/trainings/:id
router.get('/:id', async (req, res) => {
    try {
        const r = await db.query('SELECT * FROM trainings WHERE id = $1 AND department_id = $2', [req.params.id, req.departmentId]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: r.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/trainings — add to catalogue
router.post('/', async (req, res) => {
    try {
        const { name, code, vendor, category, type, description } = req.body || {};
        if (!name) return res.status(400).json({ success: false, error: 'name is required' });
        const validType = ['certification', 'course', 'training'].includes(type) ? type : 'certification';
        const r = await db.query(
            `INSERT INTO trainings (name, code, vendor, category, type, description, department_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [name, code || null, vendor || null, category || null, validType, description || null, req.departmentId]
        );
        res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, error: 'A training with this name already exists' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/trainings/:id — modify
router.put('/:id', async (req, res) => {
    try {
        const { name, code, vendor, category, type, description } = req.body || {};
        if (type && !['certification', 'course', 'training'].includes(type)) {
            return res.status(400).json({ success: false, error: 'invalid type' });
        }
        const r = await db.query(
            `UPDATE trainings
             SET name        = COALESCE($1, name),
                 code        = COALESCE($2, code),
                 vendor      = COALESCE($3, vendor),
                 category    = COALESCE($4, category),
                 type        = COALESCE($5, type),
                 description = COALESCE($6, description)
             WHERE id = $7
             RETURNING *`,
            [name || null, code || null, vendor || null, category || null, type || null, description || null, req.params.id]
        );
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: r.rows[0] });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, error: 'A training with this name already exists' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/trainings/:id — also cascades to all resource_trainings rows
router.delete('/:id', async (req, res) => {
    try {
        const r = await db.query('DELETE FROM trainings WHERE id = $1 AND department_id = $2 RETURNING id', [req.params.id, req.departmentId]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// =============================================================================
// Resource-scoped assignments: /api/trainings/assignments/...
// =============================================================================

// GET /api/trainings/assignments — list all assignments (admin overview)
router.get('/assignments/all', async (req, res) => {
    try {
        const r = await db.query(`
            SELECT rt.id, rt.resource_id, rt.training_id, rt.status,
                   rt.target_date, rt.completed_date, rt.expiry_date, rt.notes,
                   rt.created_at, rt.updated_at,
                   r.name AS resource_name,
                   t.name AS training_name, t.code AS training_code,
                   t.vendor, t.category, t.type
            FROM resource_trainings rt
            JOIN resources r  ON r.id = rt.resource_id
            JOIN trainings t  ON t.id = rt.training_id
            WHERE r.department_id = $1
            ORDER BY r.name, t.vendor, t.name
        `, [req.departmentId]);
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/trainings/assignments/expiring?within=90 — achieved certs expiring soon
router.get('/assignments/expiring', async (req, res) => {
    try {
        const within = Math.max(1, Math.min(3650, parseInt(req.query.within, 10) || 90));
        const r = await db.query(`
            SELECT rt.id, rt.resource_id, rt.training_id, rt.status,
                   rt.completed_date, rt.expiry_date, rt.notes,
                   r.name AS resource_name,
                   t.name AS training_name, t.code AS training_code,
                   t.vendor, t.category,
                   (rt.expiry_date - CURRENT_DATE) AS days_until_expiry
            FROM resource_trainings rt
            JOIN resources r  ON r.id = rt.resource_id
            JOIN trainings t  ON t.id = rt.training_id
            WHERE r.department_id = $1
              AND rt.expiry_date IS NOT NULL
              AND rt.expiry_date <= CURRENT_DATE + ($2 || ' days')::interval
              AND rt.status IN ('achieved', 'in-progress')
            ORDER BY rt.expiry_date ASC
        `, [req.departmentId, within]);
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/trainings/assignments/resource/:rid — list a resource's assignments
router.get('/assignments/resource/:rid', async (req, res) => {
    try {
        const r = await db.query(`
            SELECT rt.id, rt.resource_id, rt.training_id, rt.status,
                   rt.target_date, rt.completed_date, rt.expiry_date,
                   rt.notes, rt.created_at, rt.updated_at,
                   res.name AS resource_name,
                   t.name AS training_name, t.code AS training_code,
                   t.vendor, t.category, t.type, t.description
            FROM resource_trainings rt
            JOIN trainings t  ON t.id   = rt.training_id
            JOIN resources res ON res.id = rt.resource_id
            WHERE rt.resource_id = $1
              AND res.department_id = $2
            ORDER BY rt.status, t.vendor, t.name
        `, [req.params.rid, req.departmentId]);
        res.json({ success: true, data: r.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/trainings/assignments — assign a training to a resource
router.post('/assignments', async (req, res) => {
    try {
        const { resource_id, training_id, status, target_date, completed_date, expiry_date, notes } = req.body || {};
        if (!resource_id || !training_id) {
            return res.status(400).json({ success: false, error: 'resource_id and training_id required' });
        }
        const validStatus = ['planned', 'in-progress', 'achieved', 'expired'].includes(status) ? status : 'planned';
        const guard = await db.query(
            `SELECT 1 FROM resources r, trainings t
             WHERE r.id = $1 AND t.id = $2 AND r.department_id = $3 AND t.department_id = $3`,
            [resource_id, training_id, req.departmentId]
        );
        if (guard.rowCount === 0) return res.status(404).json({ success: false, error: 'Resource or training not in this department' });
        const r = await db.query(
            `INSERT INTO resource_trainings
             (resource_id, training_id, status, target_date, completed_date, expiry_date, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (resource_id, training_id)
             DO UPDATE SET status = EXCLUDED.status,
                          target_date = EXCLUDED.target_date,
                          completed_date = EXCLUDED.completed_date,
                          expiry_date = EXCLUDED.expiry_date,
                          notes = EXCLUDED.notes,
                          updated_at = CURRENT_TIMESTAMP
             RETURNING *`,
            [resource_id, training_id, validStatus, target_date || null, completed_date || null, expiry_date || null, notes || null]
        );
        res.status(201).json({ success: true, data: r.rows[0] });
    } catch (err) {
        if (err.code === '23503') {
            return res.status(400).json({ success: false, error: 'Unknown resource or training id' });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

// PUT /api/trainings/assignments/:id — update an existing assignment
router.put('/assignments/:id', async (req, res) => {
    try {
        const { status, target_date, completed_date, expiry_date, notes } = req.body || {};
        if (status && !['planned', 'in-progress', 'achieved', 'expired'].includes(status)) {
            return res.status(400).json({ success: false, error: 'invalid status' });
        }
        const r = await db.query(
            `UPDATE resource_trainings
             SET status         = COALESCE($1, status),
                 target_date    = $2,
                 completed_date = $3,
                 expiry_date    = $4,
                 notes          = COALESCE($5, notes),
                 updated_at     = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [status || null, target_date || null, completed_date || null, expiry_date || null, notes || null, req.params.id]
        );
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, data: r.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// DELETE /api/trainings/assignments/:id — unassign
router.delete('/assignments/:id', async (req, res) => {
    try {
        // Fetch assignment first to get resource_id and training_id for dept guard
        const existing = await db.query('SELECT resource_id, training_id FROM resource_trainings WHERE id = $1', [req.params.id]);
        if (existing.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        const { resource_id, training_id } = existing.rows[0];
        const guard = await db.query(
            `SELECT 1 FROM resources r, trainings t
             WHERE r.id = $1 AND t.id = $2 AND r.department_id = $3 AND t.department_id = $3`,
            [resource_id, training_id, req.departmentId]
        );
        if (guard.rowCount === 0) return res.status(404).json({ success: false, error: 'Resource or training not in this department' });
        const r = await db.query('DELETE FROM resource_trainings WHERE id = $1 RETURNING id', [req.params.id]);
        if (r.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
