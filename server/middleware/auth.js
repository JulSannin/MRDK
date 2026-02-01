import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';

/**
 * Middleware для проверки JWT токена
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const bearerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies?.authToken;
    const token = cookieToken || bearerToken;

    if (!token) {
        return res.status(401).json({ error: 'Требуется авторизация' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Недействительный токен' });
        }
        req.user = user;
        next();
    });
}

/**
 * Middleware для проверки прав администратора
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Next middleware
 */
export function requireAdmin(req, res, next) {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Недостаточно прав' });
    }
    next();
}
