/**
 * Кастомный класс ошибок API
 */
export class ApiError extends Error {
    constructor(
        public message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Извлекает текстовое сообщение ошибки из любого типа ошибки
 * @param {unknown} error - Ошибка любого типа
 * @returns {string} Текстовое сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }
    
    if (error instanceof Error) {
        return error.message;
    }
    
    if (typeof error === 'string') {
        return error;
    }
    
    return 'Произошла неизвестная ошибка';
}

/**
 * Обрабатывает ошибку API с логированием в dev режиме
 * @param {unknown} error - Ошибка для обработки
 * @returns {never} Выбрасывает ApiError
 */
export function handleApiError(error: unknown): never {
    const message = getErrorMessage(error);
    
    // В продакшене здесь можно добавить логирование в Sentry
    if (import.meta.env.DEV) {
        console.error('API Error:', error);
    }
    
    throw new ApiError(message);
}

/**
 * Константы сообщений об ошибках авторизации
 */
export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Неверный логин или пароль',
    TOKEN_EXPIRED: 'Сессия истекла. Войдите снова',
    UNAUTHORIZED: 'Требуется авторизация',
    FORBIDDEN: 'Недостаточно прав доступа',
} as const;

/**
 * Константы сообщений об общих ошибках
 */
export const COMMON_ERRORS = {
    NETWORK_ERROR: 'Ошибка сети. Проверьте подключение',
    SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
    NOT_FOUND: 'Ресурс не найден',
    VALIDATION_ERROR: 'Ошибка валидации данных',
} as const;
