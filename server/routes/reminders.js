import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';
import { db } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { ALLOWED_PRIORITIES, isValidDate } from '../utils/validation.js';
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
const upload = createUploadMiddleware('reminderImage', __dirname);

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const getReminderUploadPath = (fileUrl) => getUploadPath(fileUrl, uploadsRoot);

const reminderValidationSchema = {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { required: true, minLength: 1, maxLength: 5000 },
    date: {
        required: true,
        type: 'date',
        validate: (value) => isValidDate(value),
        validateMessage: 'Некорректная дата',
    },
    priority: {
        required: false,
        validate: (value) => !value || ALLOWED_PRIORITIES.has(value),
        validateMessage: 'Некорректный приоритет',
    },
};

const validateReminder = createValidationWithCleanup({
    schema: reminderValidationSchema,
    logger,
    orphanLabel: 'reminder image',
    validateAndSanitize,
});

// GET - получить все напоминания
router.get('/', async (req, res) => {
    try {
        const reminders = await db.getAllReminders();
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// GET - получить напоминание по ID
router.get('/:id', async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const reminder = await db.getReminder(validation.id);
        if (!reminder) {
            return res.status(404).json({ error: 'Напоминание не найдено' });
        }
        res.json(reminder);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// POST - создать напоминание (требует авторизации)
router.post('/', mutationLimiter, authenticateToken, requireAdmin, upload.single('image'), validateReminder, async (req, res) => {
    try {
        const { title, description, date, priority } = req.body;
        const imageUrl = req.file ? `/uploads/reminders/${req.file.filename}` : null;

        const newReminder = await db.createReminder({
            title,
            description,
            imageUrl,
            date,
            priority: priority || 'medium',
        });

        res.status(201).json(newReminder);
    } catch (error) {
        // Удаляем загруженное изображение при ошибке
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned reminder image: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// PUT - обновить напоминание (требует авторизации)
router.put('/:id', mutationLimiter, authenticateToken, requireAdmin, upload.single('image'), validateReminder, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { title, description, date, priority, completed } = req.body;
        const imageUrl = req.file ? `/uploads/reminders/${req.file.filename}` : undefined;

        const existingReminder = await db.getReminder(validation.id);
        if (!existingReminder) {
            if (req.file?.path) {
                fs.unlink(req.file.path).catch((err) => {
                    logger.error(`Failed to delete orphaned reminder image: ${req.file.path}`, err);
                });
            }
            return res.status(404).json({ error: 'Напоминание не найдено' });
        }

        const normalizedCompleted =
            completed === 1 || completed === '1' || completed === true ? 1 : 0;

        const updatePayload = {
            title,
            description,
            date,
            priority,
            completed: normalizedCompleted,
        };

        if (imageUrl) {
            updatePayload.imageUrl = imageUrl;
        }

        const updatedReminder = await db.updateReminder(validation.id, updatePayload);

        // Удаляем старое изображение если было загружено новое
        if (imageUrl && existingReminder.imageUrl) {
            const oldPath = getReminderUploadPath(existingReminder.imageUrl);
            if (oldPath) {
                fs.unlink(oldPath).catch((err) => {
                    logger.error(`Failed to delete old reminder image: ${oldPath}`, err);
                });
            }
        }

        res.json(updatedReminder);
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned reminder image: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// DELETE - удалить напоминание (требует авторизации)
router.delete('/:id', mutationLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const reminder = await db.getReminder(validation.id);
        if (!reminder) {
            return res.status(404).json({ error: 'Напоминание не найдено' });
        }

        // Удаляем изображение если есть
        if (reminder.imageUrl) {
            const imagePath = getUploadPath(reminder.imageUrl);
            if (imagePath) {
                fs.unlink(imagePath).catch((err) => {
                    logger.error(`Failed to delete reminder image: ${imagePath}`, err);
                });
            }
        }

        await db.deleteReminder(validation.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

export default router;
