import multer from 'multer';
import path from 'path';

/**
 * Конфигурации для разных типов загрузок
 * Каждый тип содержит настройки для folder, prefix, maxSize и fileFilter
 */
const UPLOAD_CONFIGS = {
    image: {
        folder: 'events',
        prefix: 'event-',
        maxSize: 5 * 1024 * 1024, // 5MB
        fileFilterType: 'image',
        errorMessage: 'Только изображения разрешены!',
    },
    document: {
        folder: 'documents',
        prefix: 'doc-',
        maxSize: 10 * 1024 * 1024, // 10MB
        fileFilterType: 'document',
        errorMessage: 'Недопустимый тип файла',
    },
    reminderImage: {
        folder: 'reminders',
        prefix: 'reminder-',
        maxSize: 5 * 1024 * 1024, // 5MB
        fileFilterType: 'image',
        errorMessage: 'Только изображения разрешены!',
    },
    workplanFile: {
        folder: 'workplan',
        prefix: 'workplan-',
        maxSize: 10 * 1024 * 1024, // 10MB
        fileFilterType: 'document',
        errorMessage: 'Недопустимый тип файла',
    },
};

/**
 * File filter validators для разных типов
 */
const FILE_FILTERS = {
    image: (file) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        return mimetype && extname;
    },
    document: (file) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const extname = path.extname(file.originalname).toLowerCase();
        return allowedTypes.includes(file.mimetype) && allowedExtensions.includes(extname);
    },
};

/**
 * Создает storage конфиг для multer
 * @param {string} uploadType - тип загрузки (image, document, reminderImage, workplanFile)
 * @param {string} __dirname - текущая директория роута
 * @returns {multer.StorageEngine} storage конфиг для multer
 */
export function createUploadStorage(uploadType, __dirname) {
    const config = UPLOAD_CONFIGS[uploadType];
    if (!config) {
        throw new Error(`Unknown upload type: ${uploadType}`);
    }

    return multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, '..', 'uploads', config.folder);
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const filename = config.prefix + uniqueSuffix + path.extname(file.originalname);
            cb(null, filename);
        },
    });
}

/**
 * Создает multer middleware для загрузки файлов
 * @param {string} uploadType - тип загрузки (image, document, reminderImage, workplanFile)
 * @param {string} __dirname - текущая директория роута
 * @returns {multer.Multer} multer middleware
 */
export function createUploadMiddleware(uploadType, __dirname) {
    const config = UPLOAD_CONFIGS[uploadType];
    if (!config) {
        throw new Error(`Unknown upload type: ${uploadType}`);
    }

    const storage = createUploadStorage(uploadType, __dirname);

    return multer({
        storage: storage,
        limits: { fileSize: config.maxSize },
        fileFilter: (req, file, cb) => {
            const filterFn = FILE_FILTERS[config.fileFilterType];
            if (!filterFn) {
                return cb(new Error(`Unknown file filter type: ${config.fileFilterType}`));
            }

            if (filterFn(file)) {
                cb(null, true);
            } else {
                cb(new Error(config.errorMessage));
            }
        },
    });
}

/**
 * Вспомогательная функция для получения пути загруженного файла
 * @param {string} fileUrl - URL файла (например, /uploads/events/event-123.jpg)
 * @param {string} uploadsRoot - корневая папка uploads
 * @returns {string|null} абсолютный путь к файлу или null
 */
export function getUploadPath(fileUrl, uploadsRoot) {
    if (!fileUrl) return null;
    const relative = fileUrl.startsWith('/uploads/') ? fileUrl.replace('/uploads/', '') : fileUrl;
    return path.join(uploadsRoot, relative);
}

/**
 * Создает middleware для валидации с автоматической очисткой загруженных файлов при ошибке
 * @param {object} options - опции конфигурации
 * @param {object} options.schema - схема валидации
 * @param {object} options.logger - логгер для ошибок
 * @param {string} options.orphanLabel - метка для логирования осиротевших файлов
 * @param {function} options.validateAndSanitize - функция валидации
 * @returns {function} middleware функция
 */
export function createValidationWithCleanup({ schema, logger, orphanLabel = 'file', validateAndSanitize }) {
    return (req, res, next) => {
        const { sanitized, errors } = validateAndSanitize(req.body, schema);

        if (errors.length > 0) {
            // Удаляем загруженный файл при ошибке валидации
            if (req.file?.path) {
                import('fs/promises').then(({ unlink }) => {
                    unlink(req.file.path).catch((err) => {
                        if (logger) {
                            logger.error(`Failed to delete orphaned ${orphanLabel}: ${req.file.path}`, err);
                        }
                    });
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
}
