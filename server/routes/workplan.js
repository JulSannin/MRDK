import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';
import { db } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { validateAndSanitize } from '../middleware/validation.js';
import { getLogger } from '../lib/logger.js';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MUTATION_MAX } from '../config.js';
import { getErrorMessage, validateId } from '../utils/errorHandler.js';

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

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/workplan'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'workplan-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const extname = path.extname(file.originalname).toLowerCase();

        if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extname)) {
            return cb(null, true);
        }
        cb(new Error('Недопустимый тип файла'));
    },
});

const getUploadPath = (fileUrl) => {
    if (!fileUrl) return null;
    const relative = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : fileUrl;
    return path.join(__dirname, '..', 'uploads', relative);
};

const createValidationWithCleanup = (schema) => (req, res, next) => {
    const { sanitized, errors } = validateAndSanitize(req.body, schema);

    if (errors.length > 0) {
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned workplan file: ${req.file.path}`, err);
            });
        }
        return res.status(400).json({
            error: 'Validation failed',
            details: errors,
        });
    }

    req.body = sanitized;
    next();
};

const workplanValidationSchema = {
    month: { required: true, minLength: 1, maxLength: 30 },
    year: {
        required: true,
        validate: (value) => {
            const yearNumber = Number(value);
            return Number.isInteger(yearNumber) && yearNumber >= 2000 && yearNumber <= 2100;
        },
        validateMessage: 'Некорректный год',
    },
    description: { required: true, minLength: 1, maxLength: 5000 },
};

// GET - получить весь план работы
router.get('/', async (req, res) => {
    try {
        const workplan = await db.getAllWorkplan();
        res.json(workplan);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// GET - получить элемент плана по ID
router.get('/:id', async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const workplanItem = await db.getWorkplanItem(validation.id);
        if (!workplanItem) {
            return res.status(404).json({ error: 'Элемент плана не найден' });
        }
        res.json(workplanItem);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// POST - создать элемент плана (требует авторизации)
router.post('/', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), createValidationWithCleanup(workplanValidationSchema), async (req, res) => {
    try {
        const { month, year, description } = req.body;
        const fileUrl = req.file ? `/uploads/workplan/${req.file.filename}` : null;

        const yearNumber = Number(year);

        const newWorkplanItem = await db.createWorkplanItem({
            month,
            year: yearNumber,
            description,
            fileUrl,
        });

        res.status(201).json(newWorkplanItem);
    } catch (error) {
        // Удаляем загруженный файл при ошибке
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned workplan file: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// PUT - обновить элемент плана (требует авторизации)
router.put('/:id', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), createValidationWithCleanup(workplanValidationSchema), async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { month, year, description } = req.body;
        const fileUrl = req.file ? `/uploads/workplan/${req.file.filename}` : undefined;

        const existingItem = await db.getWorkplanItem(validation.id);
        if (!existingItem) {
            if (req.file?.path) {
                fs.unlink(req.file.path).catch((err) => {
                    logger.error(`Failed to delete orphaned workplan file: ${req.file.path}`, err);
                });
            }
            return res.status(404).json({ error: 'Элемент плана не найден' });
        }

        const yearNumber = Number(year);

        const updatePayload = {
            month,
            year: yearNumber,
            description,
        };

        if (fileUrl) {
            updatePayload.fileUrl = fileUrl;
        }

        const updatedItem = await db.updateWorkplanItem(validation.id, updatePayload);

        // Удаляем старый файл если был загружен новый
        if (fileUrl && existingItem.fileUrl) {
            const oldPath = getUploadPath(existingItem.fileUrl);
            if (oldPath) {
                fs.unlink(oldPath).catch((err) => {
                    logger.error(`Failed to delete old workplan file: ${oldPath}`, err);
                });
            }
        }

        res.json(updatedItem);
    } catch (error) {
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned workplan file: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// DELETE - удалить элемент плана (требует авторизации)
router.delete('/:id', mutationLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const workplanItem = await db.getWorkplanItem(validation.id);
        if (!workplanItem) {
            return res.status(404).json({ error: 'Элемент плана не найден' });
        }

        // Удаляем файл если есть
        if (workplanItem.fileUrl) {
            const filePath = getUploadPath(workplanItem.fileUrl);
            if (filePath) {
                fs.unlink(filePath).catch((err) => {
                    logger.error(`Failed to delete workplan file: ${filePath}`, err);
                });
            }
        }

        await db.deleteWorkplanItem(validation.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

export default router;
