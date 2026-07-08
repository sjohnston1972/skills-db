// Test-environment defaults. Applied before any test file (jest setupFiles)
// and required by global-setup.js. Values are only set when absent so CI can
// provide its own (see .github/workflows/ci.yml).
const path = require('path');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '55433';
process.env.DB_NAME = process.env.DB_NAME || 'skills_matrix_test';
process.env.DB_USER = process.env.DB_USER || 'postgres';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
process.env.HTPASSWD_FILE = process.env.HTPASSWD_FILE
    || path.join(__dirname, 'fixtures', 'htpasswd');
