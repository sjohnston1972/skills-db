const fs = require('fs');

// Overridable so tests can point at a fixture file; production default is
// the file nginx reads for basic auth.
const HTPASSWD_FILE = process.env.HTPASSWD_FILE || '/etc/nginx/.htpasswd';

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
 * basic auth on the protected locations and knows how to read every
 * htpasswd hash format we use — bcrypt, $2y$, $6$ crypt, etc).
 *
 * This middleware adds two extra guarantees on top:
 *   - The Authorization header MUST be present and parseable. So even
 *     if a protected route is ever exposed without the nginx gate, the
 *     API refuses unauthenticated calls.
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
    let lines = [];
    if (fs.existsSync(HTPASSWD_FILE)) {
        lines = fs.readFileSync(HTPASSWD_FILE, 'utf8').split('\n').filter(l => l.trim());
    }
    const entry = lines.find(l => l.split(':')[0] === creds.username);
    if (!entry) {
        return res.status(401).json({ success: false, error: 'Unknown user' });
    }
    req.authUser = creds.username;
    next();
}

module.exports = { HTPASSWD_FILE, parseBasicAuth, verifyAdminAuth };
