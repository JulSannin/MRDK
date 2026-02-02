import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import rateLimit from 'express-rate-limit';
import { db } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getLogger } from '../lib/logger.js';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_DOCUMENT_MAX } from '../config.js';
import { getErrorMessage, validateId } from '../utils/errorHandler.js';
import { createValidationWithCleanup, getUploadPath } from '../utils/uploadHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = getLogger();
const router = express.Router();

// Rate limiting для мутаций
const mutationLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_DOCUMENT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Слишком много запросов, попробуйте позже',
});

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/documents'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
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

const uploadsRoot = path.join(__dirname, '..', 'uploads');
const getDocumentUploadPath = (fileUrl) => getUploadPath(fileUrl, uploadsRoot);

const documentValidationSchema = {
    title: { required: true, minLength: 1, maxLength: 200 },
    description: { required: false, maxLength: 1000 },
    category: { required: false, maxLength: 50 },
};

const validateDocument = createValidationWithCleanup({
    schema: documentValidationSchema,
    logger,
    orphanLabel: 'document file',
});

// GET - получить все документы
router.get('/', async (req, res) => {
    try {
        const documents = await db.getAllDocuments();
        res.json(documents);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// GET - получить документ по ID
router.get('/:id', async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const document = await db.getDocument(validation.id);
        if (!document) {
            return res.status(404).json({ error: 'Документ не найден' });
        }
        res.json(document);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// POST - создать документ (требует авторизации)
router.post('/', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), validateDocument, async (req, res) => {
    try {
        const { title, description, category } = req.body;
        const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : null;

        if (!fileUrl) {
            return res.status(400).json({ error: 'Файл обязателен' });
        }

        const newDocument = await db.createDocument({
            title,
            description,
            fileUrl,
            category,
        });

        res.status(201).json(newDocument);
    } catch (error) {
        // Удаляем загруженный файл при ошибке
        if (req.file?.path) {
            fs.unlink(req.file.path).catch((err) => {
                logger.error(`Failed to delete orphaned document file: ${req.file.path}`, err);
            });
        }
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// PUT - обновить документ (требует авторизации)
router.put('/:id', mutationLimiter, authenticateToken, requireAdmin, upload.single('file'), validateDocument, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const { title, description, category } = req.body;
        const fileUrl = req.file ? `/uploads/documents/${req.file.filename}` : undefined;

        const existingDocument = await db.getDocument(validation.id);
        if (!existingDocument) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        const updates = { title, description, category };
        if (fileUrl) {
            updates.fileUrl = fileUrl;
        }

        const updatedDocument = await db.updateDocument(validation.id, updates);

        if (fileUrl && existingDocument.fileUrl) {
            const oldPath = getDocumentUploadPath(existingDocument.fileUrl);
            if (oldPath) {
                fs.unlink(oldPath).catch((err) => {
                    logger.error(`Failed to delete old document file: ${oldPath}`, err);
                });
            }
        }

        res.json(updatedDocument);
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// DELETE - удалить документ (требует авторизации)
router.delete('/:id', mutationLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
        const validation = validateId(req.params.id);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }

        const document = await db.getDocument(validation.id);
        if (!document) {
            return res.status(404).json({ error: 'Документ не найден' });
        }

        await db.deleteDocument(validation.id);

        if (document.fileUrl) {
            const filePath = getDocumentUploadPath(document.fileUrl);
            if (filePath) {
                fs.unlink(filePath).catch((err) => {
                    logger.error(`Failed to delete document file: ${filePath}`, err);
                });
            }
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

export default router;
