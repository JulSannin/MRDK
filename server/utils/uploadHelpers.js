import fs from 'fs/promises';
import path from 'path';
import { validateAndSanitize } from '../middleware/validation.js';

export function getUploadPath(fileUrl, uploadsRoot) {
    if (!fileUrl) return null;
    const relative = fileUrl.startsWith('/uploads/')
        ? fileUrl.replace('/uploads/', '')
        : fileUrl;
    return path.join(uploadsRoot, relative);
}

export function createValidationWithCleanup({ schema, logger, orphanLabel = 'file' }) {
    return (req, res, next) => {
        const { sanitized, errors } = validateAndSanitize(req.body, schema);

        if (errors.length > 0) {
            if (req.file?.path) {
                fs.unlink(req.file.path).catch((err) => {
                    if (logger) {
                        logger.error(`Failed to delete orphaned ${orphanLabel}: ${req.file.path}`, err);
                    }
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
