import dotenv from 'dotenv';

dotenv.config();

/** Секретный ключ для подписи JWT токенов */
export const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-secret-change-in-production' : undefined);

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required in production');
}

if (process.env.NODE_ENV === 'production' && JWT_SECRET.includes('dev-secret')) {
    throw new Error('Please set a strong JWT_SECRET in production');
}

/** Порт сервера */
export const PORT = process.env.PORT || 5000;

/** Режим работы приложения */
export const NODE_ENV = process.env.NODE_ENV || 'development';

/** Уровень логирования */
export const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/** Политика SameSite для cookies */
const rawSameSite = process.env.COOKIE_SAMESITE?.toLowerCase();
const allowedSameSite = new Set(['lax', 'strict', 'none']);
export const COOKIE_SAMESITE = allowedSameSite.has(rawSameSite)
    ? rawSameSite
    : (NODE_ENV === 'production' ? 'lax' : 'lax');

if (rawSameSite && !allowedSameSite.has(rawSameSite)) {
    throw new Error('COOKIE_SAMESITE must be one of: lax, strict, none');
}

/** Требовать ли аутентификацию для доступа к загруженным файлам */
export const UPLOADS_REQUIRE_AUTH = process.env.UPLOADS_REQUIRE_AUTH === 'true';

/** Разрешенные origins для CORS в режиме разработки */
const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/** Список разрешенных origins для CORS */
export const CORS_ORIGINS = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
    : (NODE_ENV !== 'production' ? defaultDevOrigins : []);

/** Количество раундов для хеширования паролей bcrypt */
export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

/** Rate limiting конфигурация */
export const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 минут по умолчанию
export const RATE_LIMIT_AUTH_MAX = parseInt(process.env.RATE_LIMIT_AUTH_MAX || '20', 10);
export const RATE_LIMIT_MUTATION_MAX = parseInt(process.env.RATE_LIMIT_MUTATION_MAX || '50', 10);
export const RATE_LIMIT_DOCUMENT_MAX = parseInt(process.env.RATE_LIMIT_DOCUMENT_MAX || '30', 10);

if (process.env.NODE_ENV === 'production' && (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD)) {
    throw new Error('ADMIN_USERNAME и ADMIN_PASSWORD обязательны в production');
}
