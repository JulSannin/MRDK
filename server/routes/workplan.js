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
import { VALIDATION_SCHEMAS } from '../utils/validationSchemas.js';

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

// Настройка multer для загрузки файлов (используем фабрику из multerHelpers)
const upload = createUploadMiddleware('workplanFile', __dirname);

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const getWorkplanUploadPath = (fileUrl) => getUploadPath(fileUrl, uploadsRoot);

// Схема валидации для плана работы (используем централизованную схему)
const workplanValidationSchema = VALIDATION_SCHEMAS.workplan;

const validateWorkplan = createValidationWithCleanup({
    schema: workplanValidationSchema,
    logger,
    orphanLabel: 'workplan file',
    validateAndSanitize,
});

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
router.post('/', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), validateWorkplan, async (req, res) => {
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
router.put('/:id', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), validateWorkplan, async (req, res) => {
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
            const oldPath = getWorkplanUploadPath(existingItem.fileUrl);
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
            const filePath = getWorkplanUploadPath(workplanItem.fileUrl);
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
