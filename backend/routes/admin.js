const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');
const { HTPASSWD_FILE, verifyAdminAuth } = require('../middleware/auth');

function readLines() {
    if (!fs.existsSync(HTPASSWD_FILE)) return [];
    return fs.readFileSync(HTPASSWD_FILE, 'utf8')
        .split('\n')
        .filter(l => l.trim());
}

function writeLines(lines) {
    fs.writeFileSync(HTPASSWD_FILE, lines.join('\n') + (lines.length ? '\n' : ''));
}

// parseBasicAuth/verifyAdminAuth live in middleware/auth.js (shared with
// the settings, insights and data routers).

// All admin routes require an authenticated admin.
router.use(verifyAdminAuth);

// GET /api/admin/users
router.get('/users', (req, res) => {
    try {
        const users = readLines().map(l => ({ username: l.split(':')[0] }));
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST /api/admin/users
router.post('/users', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return res.status(400).json({ error: 'Username may only contain letters, numbers, dots, hyphens and underscores' });
        }

        const lines = readLines();
        if (lines.some(l => l.split(':')[0] === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const hash = (await bcrypt.hash(password, 10)).replace(/^\$2b\$/, '$2y$');
        lines.push(`${username}:${hash}`);
        writeLines(lines);

        res.json({ username });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/admin/users/:username
router.delete('/users/:username', (req, res) => {
    try {
        const { username } = req.params;
        const lines = readLines();

        if (lines.length <= 1) {
            return res.status(400).json({
                error: 'Cannot delete the last administrator (would lock everyone out).',
            });
        }
        if (username === req.authUser) {
            return res.status(400).json({
                error: 'You cannot delete the account you are currently logged in as.',
            });
        }

        const next = lines.filter(l => l.split(':')[0] !== username);
        if (next.length === lines.length) {
            return res.status(404).json({ error: 'User not found' });
        }
        writeLines(next);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
