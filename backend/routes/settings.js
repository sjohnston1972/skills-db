const express = require('express');
const router = express.Router();
const db = require('../db');
// Mutations below are admin-only. The GETs stay open at the Express layer —
// they only ever report presence/booleans, and nginx basic auth covers them.
const { verifyAdminAuth } = require('../middleware/auth');

const API_KEY_META_KEYS = ['anthropic_api_key'];

// Boolean feature flags stored as text 'true'/'false' in the metadata table.
const FLAG_KEYS = ['ai_enabled'];
const FLAG_DEFAULTS = { ai_enabled: true };

// Read a boolean flag, DB-first, falling back to the supplied default.
async function getFlag(name, def) {
    const r = await db.query(`SELECT value FROM metadata WHERE key = $1`, [name]);
    if (r.rows.length && r.rows[0].value != null) return r.rows[0].value === 'true';
    return def;
}

/** GET /api/settings/api-keys
 *  Returns which keys are configured (presence only, never the value).
 */
router.get('/api-keys', async (req, res) => {
    try {
        const r = await db.query(
            `SELECT key, LENGTH(value) > 0 AS configured FROM metadata WHERE key = ANY($1)`,
            [API_KEY_META_KEYS]
        );
        const out = {};
        API_KEY_META_KEYS.forEach(k => { out[k] = { configured: false }; });
        r.rows.forEach(row => { out[row.key] = { configured: !!row.configured }; });
        // Also check env (fallback if DB not set)
        for (const k of API_KEY_META_KEYS) {
            const env = process.env[k.toUpperCase()];
            if (!out[k].configured && env && env.length > 0) {
                out[k] = { configured: true, source: 'env' };
            } else if (out[k].configured) {
                out[k].source = 'db';
            }
        }
        res.json({ success: true, data: out });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/** PUT /api/settings/api-keys/:name  body {value}  */
router.put('/api-keys/:name', verifyAdminAuth, async (req, res) => {
    try {
        const { name } = req.params;
        const { value } = req.body || {};
        if (!API_KEY_META_KEYS.includes(name)) {
            return res.status(400).json({ success: false, error: 'Unknown API key name' });
        }
        if (!value || typeof value !== 'string' || value.length < 10) {
            return res.status(400).json({ success: false, error: 'Provide a non-empty key (min 10 chars)' });
        }
        await db.query(
            `INSERT INTO metadata (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [name, value]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/** DELETE /api/settings/api-keys/:name — revoke (clear) the stored key  */
router.delete('/api-keys/:name', verifyAdminAuth, async (req, res) => {
    try {
        const { name } = req.params;
        if (!API_KEY_META_KEYS.includes(name)) {
            return res.status(400).json({ success: false, error: 'Unknown API key name' });
        }
        await db.query(`DELETE FROM metadata WHERE key = $1`, [name]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/** GET /api/settings/flags — current feature-flag values. */
router.get('/flags', async (req, res) => {
    try {
        const out = {};
        for (const k of FLAG_KEYS) out[k] = await getFlag(k, FLAG_DEFAULTS[k]);
        res.json({ success: true, data: out });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/** PUT /api/settings/flags/:name  body { value: boolean } — set a flag. */
router.put('/flags/:name', verifyAdminAuth, async (req, res) => {
    try {
        const { name } = req.params;
        if (!FLAG_KEYS.includes(name)) {
            return res.status(400).json({ success: false, error: 'Unknown flag name' });
        }
        const { value } = req.body || {};
        if (typeof value !== 'boolean') {
            return res.status(400).json({ success: false, error: 'value must be a boolean' });
        }
        await db.query(
            `INSERT INTO metadata (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
            [name, String(value)]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Internal helper: get an API key, DB-first then env fallback
async function getApiKey(name) {
    const r = await db.query(`SELECT value FROM metadata WHERE key = $1`, [name]);
    if (r.rows.length && r.rows[0].value) return r.rows[0].value;
    return process.env[name.toUpperCase()] || null;
}

module.exports = router;
module.exports.getApiKey = getApiKey;
module.exports.getFlag = getFlag;
// Single source of truth for which metadata keys hold secrets — consumed by
// the /api/metadata denylist in server.js.
module.exports.API_KEY_META_KEYS = API_KEY_META_KEYS;
