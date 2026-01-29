const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'skills_matrix',
    user: process.env.DB_USER || 'skillsuser',
    password: process.env.DB_PASSWORD || 'changeme123',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

// Helper function to query the database
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function for transactions
const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);

    // Set a timeout to release the client after 30 seconds
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 30 seconds!');
    }, 30000);

    // Monkey patch the release method to clear our timeout
    client.release = () => {
        clearTimeout(timeout);
        client.release = release;
        return release();
    };

    return client;
};

// Initialize database schema
const initDatabase = async () => {
    const fs = require('fs');
    const path = require('path');

    try {
        const schemaPath = path.join(__dirname, 'init-db.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Initializing database schema...');
        await query(schema);
        console.log('Database schema initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        return false;
    }
};

module.exports = {
    query,
    getClient,
    pool,
    initDatabase
};
