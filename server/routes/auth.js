import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../database/db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { JWT_SECRET, BCRYPT_ROUNDS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_AUTH_MAX } from '../config.js';
import { getErrorMessage } from '../utils/errorHandler.js';

const router = express.Router();

const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
});

// Опции cookie для безопасности
const COOKIE_OPTIONS = {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE || (process.env.NODE_ENV === 'production' ? 'lax' : 'lax'),
    secure: process.env.NODE_ENV === 'production' || process.env.COOKIE_SAMESITE === 'none',
    path: '/',
};

// POST - вход в систему
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Введите логин и пароль' });
        }

        const user = await db.getUserByUsername(username);

        if (!user) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный логин или пароль' });
        }

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: '24h',
        });

        res.cookie('authToken', token, {
            ...COOKIE_OPTIONS,
            maxAge: 24 * 60 * 60 * 1000,
        });

        res.json({
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// POST - регистрация нового пользователя (только для существующих админов)
router.post('/register', authLimiter, authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Введите логин и пароль' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Логин должен быть не менее 3 символов' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов' });
        }

        const existingUser = await db.getUserByUsername(username);

        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const newUser = await db.createUser({
            username,
            password: hashedPassword,
            role: 'admin',
        });

        res.status(201).json({
            message: 'Пользователь создан',
            user: {
                id: newUser.id,
                username: newUser.username,
                role: newUser.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: getErrorMessage(error) });
    }
});

// GET - проверка токена
router.get('/verify', async (req, res) => {
    try {
        const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.json({ valid: false });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await db.getUserById(decoded.id);
        if (!user) {
            return res.json({ valid: false });
        }

        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.json({ valid: false });
    }
});

// GET - получить CSRF токен (и установить cookie если нужно)
router.get('/csrf-token', (req, res) => {
    // csurf требует что бы было выполнено перед вызовом csrfToken()
    // Токен будет сгенерирован и cookie установлена автоматически
    res.json({ csrfToken: req.csrfToken() });
});

// POST - выход из системы
router.post('/logout', (req, res) => {
    res.clearCookie('authToken', COOKIE_OPTIONS);
    res.json({ success: true });
});

export default router;
