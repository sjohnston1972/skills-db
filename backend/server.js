const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

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

// Metadata endpoint
app.get('/api/metadata', async (req, res) => {
    try {
        const result = await db.query('SELECT key, value FROM metadata ORDER BY key');

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

// Health check endpoint
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
            const fs = require('fs');
            const path = require('path');
            const migrationsDir = path.join(__dirname, 'migrations');
            if (fs.existsSync(migrationsDir)) {
                const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
                for (const f of files) {
                    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
                    const statements = sql.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
                    try {
                        for (const stmt of statements) await db.query(stmt);
                        console.log(`Migration ${f}: ok (${statements.length} statements).`);
                    } catch (e) {
                        console.warn(`Migration ${f}: ${e.message} — run manually as 'postgres' if needed.`);
                    }
                }
            }
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

// Start the server
startServer();

module.exports = app;
