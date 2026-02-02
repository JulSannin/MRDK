import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import csrf from 'csurf';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import eventsRouter from './routes/events.js';
import documentsRouter from './routes/documents.js';
import remindersRouter from './routes/reminders.js';
import workplanRouter from './routes/workplan.js';
import authRouter from './routes/auth.js';
import { initDatabase, db } from './database/db.js';
import { initLogger, getLogger } from './lib/logger.js';
import { PORT, NODE_ENV, LOG_LEVEL, CORS_ORIGINS, COOKIE_SAMESITE, UPLOADS_REQUIRE_AUTH } from './config.js';
import { authenticateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = initLogger(LOG_LEVEL);

const app = express();

if (NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

const corsOptions = CORS_ORIGINS.length > 0 ? {
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    exposedHeaders: ['Set-Cookie'],
} : {
    origin: false,
    credentials: true,
};

// Security & Performance Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
        },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(compression());

if (NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            return res.redirect(`https://${req.header('host')}${req.url}`);
        }
        next();
    });
}

app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        sameSite: NODE_ENV === 'production' ? 'None' : COOKIE_SAMESITE,
        secure: NODE_ENV === 'production' || COOKIE_SAMESITE === 'none',
        path: '/',
    },
});
app.use(csrfProtection);

if (UPLOADS_REQUIRE_AUTH) {
    app.use('/uploads', authenticateToken);
}

// Добавляем CORS headers для статических файлов
app.use('/uploads', (req, res, next) => {
    const origin = req.headers.origin;
    if (origin && CORS_ORIGINS.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use('/uploads', express.static(join(__dirname, 'uploads')));

await initDatabase();

app.use('/api/events', eventsRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/reminders', remindersRouter);
app.use('/api/workplan', workplanRouter);
app.use('/api/auth', authRouter);

/**
 * Проверка работоспособности сервера
 */
app.get('/api/health', async (req, res) => {
    try {
        const dbCheck = await db.loadDb().then(() => true).catch(() => false);
        res.json({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbCheck ? 'connected' : 'error',
            uptime: process.uptime(),
            environment: NODE_ENV,
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'error',
            timestamp: new Date().toISOString(),
        });
    }
});

/**
 * Обработчик 404 ошибок
 */
app.use((req, res) => {
    logger.warn(`404 Not Found: ${req.method} ${req.path}`);
    res.status(404).json({ error: 'Endpoint не найден', path: req.path });
});

/**
 * Глобальный обработчик ошибок
 */
app.use((error, req, res, next) => {
    logger.error(`Unhandled error: ${error.message}`, { stack: error.stack });
    
    if (error.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    
    const status = error.status || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : (error.message || 'Internal Server Error');
    res.status(status).json({ error: message });
});

app.listen(PORT, () => {
    logger.info(`✅ Server running on http://localhost:${PORT}`);
});

process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', { promise, reason });
});
