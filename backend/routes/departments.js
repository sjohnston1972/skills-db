const express = require('express');
const router = express.Router();
const db = require('../db');

function shape(row) {
  return { id: row.id, slug: row.slug, name: row.name, accent: row.accent, sortOrder: row.sort_order };
}

// GET /api/departments — list for the switcher
router.get('/', async (req, res) => {
  try {
    const r = await db.query('SELECT id, slug, name, accent, sort_order FROM departments ORDER BY sort_order, name');
    res.json({ success: true, data: r.rows.map(shape) });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/departments/:id — rename only
router.patch('/:id', async (req, res) => {
  try {
    const name = (req.body && req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ success: false, error: 'Department name is required' });
    }
    const r = await db.query(
      'UPDATE departments SET name = $1 WHERE id = $2 RETURNING id, slug, name, accent, sort_order',
      [name, req.params.id]
    );
    if (r.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Department not found' });
    }
    res.json({ success: true, data: shape(r.rows[0]) });
  } catch (error) {
    console.error('Error renaming department:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
