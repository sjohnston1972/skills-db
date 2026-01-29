const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

// Import routes
const dataRoutes = require('./routes/data');
const resourcesRoutes = require('./routes/resources');
const skillsRoutes = require('./routes/skills');

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
            console.log('Database not fully initialized. Running initialization...');
            await db.initDatabase();
            console.log('Database initialized successfully!');
        } else {
            console.log('Database already initialized.');
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
