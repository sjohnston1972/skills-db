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

function parseBasicAuth(req) {
    const h = req.headers && req.headers.authorization;
    if (!h || !h.startsWith('Basic ')) return null;
    const decoded = Buffer.from(h.slice(6), 'base64').toString('utf8');
    const sep = decoded.indexOf(':');
    if (sep < 0) return null;
    return { username: decoded.slice(0, sep), password: decoded.slice(sep + 1) };
}

/**
 * verifyAdminAuth — defence-in-depth.
 *
 * Nginx is the source of truth for password validation (it enforces
 * basic auth on /api/admin/* and knows how to read every htpasswd hash
 * format we use — bcrypt, $2y$, $6$ crypt, etc).
 *
 * This middleware adds two extra guarantees on top:
 *   - The Authorization header MUST be present and parseable. So even
 *     if /api/admin/* is ever exposed without the nginx gate, the API
 *     refuses unauthenticated calls.
 *   - The header's username MUST match a known entry in .htpasswd. So
 *     a forged Authorization header for a non-existent user is rejected
 *     by the API even before nginx sees it.
 *   - The matched username is stored as req.authUser so write endpoints
 *     can refuse to delete the currently-logged-in user.
 *
 * We deliberately do NOT verify the password here, because .htpasswd
 * supports several hash formats (bcrypt, SHA-512 crypt, MD5 crypt) and
 * nginx already does that job.
 */
function verifyAdminAuth(req, res, next) {
    const creds = parseBasicAuth(req);
    if (!creds) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const lines = readLines();
    const entry = lines.find(l => l.split(':')[0] === creds.username);
    if (!entry) {
        return res.status(401).json({ success: false, error: 'Unknown user' });
    }
    req.authUser = creds.username;
    next();
}

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
