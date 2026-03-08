const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const fs = require('fs');

const HTPASSWD_FILE = '/etc/nginx/.htpasswd';

function readLines() {
    if (!fs.existsSync(HTPASSWD_FILE)) return [];
    return fs.readFileSync(HTPASSWD_FILE, 'utf8')
        .split('\n')
        .filter(l => l.trim());
}

function writeLines(lines) {
    fs.writeFileSync(HTPASSWD_FILE, lines.join('\n') + (lines.length ? '\n' : ''));
}

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
        if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
            return res.status(400).json({ error: 'Username may only contain letters, numbers, dots, hyphens and underscores' });
        }

        const lines = readLines();
        if (lines.some(l => l.split(':')[0] === username)) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        // bcrypt hash; replace $2b$ with $2y$ for nginx compatibility
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
        const lines = readLines().filter(l => l.split(':')[0] !== username);
        writeLines(lines);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
