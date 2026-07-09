const express = require('express');
const path = require('path');
require('dotenv').config();

const db = require('./db');

// Import routes
const dataRoutes = require('./routes/data');
const resourcesRoutes = require('./routes/resources');
const skillsRoutes = require('./routes/skills');
const adminRoutes = require('./routes/admin');
const staffingRoutes = require('./routes/staffing');
const dataQualityRoutes = require('./routes/dataquality');
const exportRoutes = require('./routes/export');
const trainingsRoutes = require('./routes/trainings');
const insightsRoutes = require('./routes/insights');
const settingsRoutes = require('./routes/settings');
const departmentsRoutes = require('./routes/departments');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware. No CORS: the frontend is served same-origin by nginx, so
// cross-origin API access is deliberately not enabled (#13).
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint. Mounted BEFORE the department middleware so it
// stays functional even when the departments table is missing (e.g. right
// after a schema reset) — the Docker HEALTHCHECK depends on it.
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await db.query('SELECT 1');

        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message
        });
    }
});

// Metadata endpoint (not department-scoped, so mounted before the middleware).
// Secret keys (stored API keys) are excluded — the Settings API only ever
// reports their presence, never the value.
const { API_KEY_META_KEYS } = require('./routes/settings');
app.get('/api/metadata', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT key, value FROM metadata WHERE key <> ALL($1) ORDER BY key',
            [API_KEY_META_KEYS]
        );

        // Convert to key-value object with camelCase keys
        const metadata = {};
        result.rows.forEach(row => {
            // Convert snake_case to camelCase
            const camelKey = row.key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
            metadata[camelKey] = row.value;
        });

        res.json({
            success: true,
            data: metadata
        });
    } catch (error) {
        console.error('Error fetching metadata:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Reset rebuilds the whole schema, so like health/metadata it must not
// depend on the department middleware — that middleware queries a table
// reset may be about to (re)create. Admin auth + confirm token enforced
// by the handler (#12, #5/#15).
const { resetHandler } = require('./routes/data');
const { verifyAdminAuth } = require('./middleware/auth');
app.post('/api/data/reset', verifyAdminAuth, resetHandler);

const { departmentMiddleware } = require('./middleware/department');
app.use('/api', departmentMiddleware(db));

// API Routes
app.use('/api/data', dataRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staffing', staffingRoutes);
app.use('/api/data-quality', dataQualityRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/departments', departmentsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'API endpoint not found'
    });
});

// Initialize database and start server
const startServer = async () => {
    try {
        console.log('Starting Skills Matrix API Server...');
        console.log(`Node Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`Database Host: ${process.env.DB_HOST || 'localhost'}`);

        // Test database connection
        console.log('Testing database connection...');
        await db.query('SELECT 1');
        console.log('Database connection successful!');

        // Check if database is initialized
        const tablesResult = await db.query(`
            SELECT COUNT(*) as count
            FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name IN ('resources', 'main_skills', 'sub_skills', 'resource_sub_skills', 'metadata')
        `);

        const tableCount = parseInt(tablesResult.rows[0].count);

        if (tableCount < 5) {
            console.log('⚠️  WARNING: Database not fully initialized. Please run init-db.sql manually.');
            console.log('   Tables found:', tableCount, '/ 5');
            // Commented out auto-init to prevent data loss
            // await db.initDatabase();
        } else {
            console.log('Database initialized. Tables:', tableCount, '/ 5');
        }

        // Apply additive migrations (safe to re-run). Note: the app user is
        // not always the table owner, so ALTERs may fail. Migrations should
        // be applied manually as the postgres superuser; this loop just
        // surfaces what's outstanding.
        try {
            const { applyMigrations } = require('./lib/migrations');
            const { applied, failed } = await applyMigrations(db.query);
            applied.forEach(f => console.log(`Migration ${f}: ok.`));
            failed.forEach(f => console.warn(`Migration ${f.file}: ${f.error} — run manually as 'postgres' if needed.`));
        } catch (mErr) {
            console.error('Migration runner failed (non-fatal):', mErr.message);
        }

        // Start listening
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Server is running on port ${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
            console.log(`   API endpoints: http://localhost:${PORT}/api/*`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle process termination gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});

// Start the server only when run directly (`npm start`). Tests require()
// this module to get the app without opening a port or running migrations.
if (require.main === module) {
    startServer();
}

module.exports = app;
