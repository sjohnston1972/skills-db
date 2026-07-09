const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Apply every backend/migrations/*.sql in filename order.
 *
 * Each file is executed whole as one multi-statement simple query —
 * deliberately NOT split on `;`: the historic splitting loop filtered
 * chunks with startsWith('--'), silently dropping any statement that
 * followed a comment.
 *
 * Per-file try/catch: one failing migration (e.g. a non-idempotent
 * ADD CONSTRAINT on re-run, or the app user not owning a table) does not
 * block later files. Callers decide whether failures are fatal.
 */
async function applyMigrations(query, dir = MIGRATIONS_DIR) {
    const applied = [];
    const failed = [];
    if (!fs.existsSync(dir)) return { applied, failed };
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const f of files) {
        const sql = fs.readFileSync(path.join(dir, f), 'utf8');
        try {
            await query(sql);
            applied.push(f);
        } catch (e) {
            failed.push({ file: f, error: e.message });
        }
    }
    return { applied, failed };
}

module.exports = { applyMigrations };
