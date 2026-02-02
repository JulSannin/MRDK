import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';
import { db } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getLogger } from '../lib/logger.js';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MUTATION_MAX } from '../config.js';
import { getErrorMessage, validateId } from '../utils/errorHandler.js';
import { createUploadMiddleware, getUploadPath } from '../utils/multerHelpers.js';
import { createValidationWithCleanup } from '../utils/uploadHelpers.js';
import { validateAndSanitize } from '../middleware/validation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = getLogger();
const router = express.Router();

// Rate limiting для мутаций
const mutationLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MUTATION_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Слишком много запросов, попробуйте позже',
});

// Настройка multer для загрузки изображений (используем фабрику из multerHelpers)
const upload = createUploadMiddleware('image', __dirname);

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const getEventUploadPath = (fileUrl) => getUploadPath(fileUrl, uploadsRoot);

const MAX_EVENTS_LIMIT = 50;

// Схема валидации для событий
const eventValidationSchema = {
    title: { required: true, minLength: 3, maxLength: 255 },
    shortDescription: { required: true, minLength: 10, maxLength: 500 },
    fullDescription: { required: true, minLength: 20, maxLength: 5000 },
    date: { required: true, type: 'date' },
};

const validateEvent = createValidationWithCleanup({
    schema: eventValidationSchema,
    logger,
    orphanLabel: 'event image',
    validateAndSanitize,
});

// GET - получить все события с пагинацией
router.get('/', async (req, res) => {
    try {
        const events = await db.getAllEvents();
        
        // Пагинация (опциональная)
        const page = req.query.page ? Number.parseInt(String(req.query.page), 10) : null;
        const limit = req.query.limit ? Number.parseInt(String(req.query.limit), 10) : null;

        if ((page !== null && (Number.isNaN(page) || page < 1)) || (limit !== null && (Number.isNaN(limit) || limit < 1))) {
            return res.status(400).json({ error: 'Некорректные параметры пагинации' });
        }

        if (limit !== null && limit > MAX_EVENTS_LIMIT) {
            return res.status(400).json({ error: `Лимит не должен превышать ${MAX_EVENTS_LIMIT}` });
        }
        
        if (page && limit) {
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedEvents = events.slice(startIndex, endIndex);
            
            return res.json({
                data: paginatedEvents,
                pagination: {
                    page,
                    limit,
                    total: events.length,
                    totalPages: Math.ceil(events.length / limit),
                },
            });
        }
        
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// GET - получить событие по ID
router.get('/:id', async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        
        const event = await db.getEvent(validation.id);
        if (!event) {
            return res.status(404).json({ error: 'Событие не найдено' });
        }
        res.json(event);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

// POST - создать событие (требует авторизации)
router.post('/', mutationLimiter, authenticateToken, requireAdmin, upload.single('image'), validateEvent, async (req, res) => {
    try {
        const { title, shortDescription, fullDescription, date } = req.body;
        const image = req.file ? `/uploads/events/${req.file.filename}` : null;

        const newEvent = await db.createEvent({
            title,
            shortDescription,
            fullDescription,
            date,
            image,
        });

        res.status(201).json(newEvent);
    } catch (error) {
        // Удаляем загруженный файл при ошибке
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned event image: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// PUT - обновить событие (требует авторизации)
router.put('/:id', mutationLimiter, authenticateToken, requireAdmin, upload.single('image'), validateEvent, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        
        const { title, shortDescription, fullDescription, date } = req.body;
        const image = req.file ? `/uploads/events/${req.file.filename}` : undefined;

        const existingEvent = await db.getEvent(validation.id);
        if (!existingEvent) {
            return res.status(404).json({ error: 'Событие не найдено' });
        }

        const updates = {
            title,
            shortDescription,
            fullDescription,
            date,
        };

        if (image) {
            updates.image = image;
        }

        const updatedEvent = await db.updateEvent(validation.id, updates);

        if (image && existingEvent.image) {
            const oldPath = getEventUploadPath(existingEvent.image);
            if (oldPath) {
                fs.unlink(oldPath).catch((err) => {
                    logger.error(`Failed to delete old event image: ${oldPath}`, err);
                });
            }
        }

        res.json(updatedEvent);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// DELETE - удалить событие (требует авторизации)
router.delete('/:id', mutationLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        
        const event = await db.getEvent(validation.id);
        
        if (!event) {
            return res.status(404).json({ error: 'Событие не найдено' });
        }

        await db.deleteEvent(validation.id);

        if (event.image) {
            const filePath = getEventUploadPath(event.image);
            if (filePath) {
                fs.unlink(filePath).catch((err) => {
                    logger.error(`Failed to delete event image: ${filePath}`, err);
                });
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

export default router;
