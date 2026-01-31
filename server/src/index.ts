import dotenv from 'dotenv';
// Load environment variables FIRST before any other imports
dotenv.config();
console.log('🔧 ENV loaded. DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { initializeDatabase } from './config/database.js';
import schemesRouter from './routes/schemes.js';
import searchRouter from './routes/search.js';
import usersRouter from './routes/users.js';
import chatRouter from './routes/chat.js';
import authRouter from './routes/auth.js';
import {
    errorHandler,
    notFoundHandler,
    requestLogger
} from './middleware/errorHandler.js';

// ============================================
// Initialize Express App
// ============================================

const app = express();
const PORT = parseInt(process.env.PORT || '3001');

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
        success: false,
        error: 'Too many requests, please try again later.',
    },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use(requestLogger);
}

// ============================================
// Initialize Database
// ============================================

async function startServer() {
    try {
        await initializeDatabase();
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Failed to connect to database:', error);
        process.exit(1);
    }

    // ============================================
    // API Routes
    // ============================================

    // Health check
    app.get('/api/health', (_req, res) => {
        res.json({
            success: true,
            message: 'JanScheme API is running',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            database: 'PostgreSQL (Supabase)',
        });
    });

    // Main routes
    app.use('/api/schemes', schemesRouter);
    app.use('/api/search', searchRouter);
    app.use('/api/users', usersRouter);
    app.use('/api/chat', chatRouter);
    app.use('/api/auth', authRouter);

    // ============================================
    // Error Handling
    // ============================================

    app.use(notFoundHandler);
    app.use(errorHandler);

    // ============================================
    // Start Server
    // ============================================

    app.listen(PORT, () => {
        console.log('');
        console.log('🇮🇳 ========================================');
        console.log('   JanScheme API Server');
        console.log('   AI Government Scheme Advisory Platform');
        console.log('   Database: PostgreSQL (Supabase)');
        console.log('========================================');
        console.log('');
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Endpoints:`);
        console.log(`   GET  /api/health          - Health check`);
        console.log(`   GET  /api/schemes         - List all schemes`);
        console.log(`   GET  /api/schemes/:id     - Get scheme by ID/slug`);
        console.log(`   GET  /api/schemes/search  - Search schemes`);
        console.log(`   POST /api/search/smart    - AI-powered search`);
        console.log(`   POST /api/chat            - Chat with assistant`);
        console.log('');
        console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
        console.log('');
    });
}

startServer();

export default app;
