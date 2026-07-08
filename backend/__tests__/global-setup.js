// Jest global setup: (re)creates the full schema in the test database.
// Runs init-db.sql, then every backend/migrations/*.sql in filename order.
// Each file is executed whole (multi-statement simple query) — deliberately
// NOT the `;`-splitting loop server.js used historically, whose
// startsWith('--') filter silently dropped statements preceded by comments.
require('./setup-env');

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function connectWithRetry(config, attempts = 15) {
    for (let i = 1; ; i++) {
        const client = new Client(config);
        try {
            await client.connect();
            return client;
        } catch (err) {
            await client.end().catch(() => {});
            if (i >= attempts) throw err;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

module.exports = async () => {
    const client = await connectWithRetry({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        // Migrations GRANT to skillsuser; make sure the role exists in the
        // throwaway test cluster.
        await client.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'skillsuser') THEN
                    CREATE ROLE skillsuser LOGIN PASSWORD 'changeme123';
                END IF;
            END $$;
        `);

        const backendDir = path.join(__dirname, '..');
        await client.query(fs.readFileSync(path.join(backendDir, 'init-db.sql'), 'utf8'));

        const migrationsDir = path.join(backendDir, 'migrations');
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
        for (const f of files) {
            await client.query(fs.readFileSync(path.join(migrationsDir, f), 'utf8'));
        }
    } finally {
        await client.end();
    }
};
