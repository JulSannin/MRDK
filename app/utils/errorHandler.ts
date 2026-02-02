// Custom API error class
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

export type ErrorDetails = {
    message: string;
    status?: number;
    code?: string;
    original?: unknown;
};

// Extract error message from any error type
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

// Get full error details
export function getErrorDetails(error: unknown): ErrorDetails {
    if (error instanceof ApiError) {
        return { message: error.message, status: error.status, code: error.code, original: error };
    }

    if (error instanceof Error) {
        return { message: error.message, original: error };
    }

    if (typeof error === 'string') {
        return { message: error, original: error };
    }

    return { message: 'Произошла неизвестная ошибка', original: error };
}

// Handle API error with logging
export function handleApiError(error: unknown): never {
    const details = getErrorDetails(error);
    
    if (import.meta.env.DEV) {
        console.error('API Error:', details);
    }
    
    throw new ApiError(details.message, details.status, details.code);
}

// Auth error messages
export const AUTH_ERRORS = {
    INVALID_CREDENTIALS: 'Неверный логин или пароль',
    TOKEN_EXPIRED: 'Сессия истекла. Войдите снова',
    UNAUTHORIZED: 'Требуется авторизация',
    FORBIDDEN: 'Недостаточно прав доступа',
} as const;

// Common error messages
export const COMMON_ERRORS = {
    NETWORK_ERROR: 'Ошибка сети. Проверьте подключение',
    SERVER_ERROR: 'Ошибка сервера. Попробуйте позже',
    NOT_FOUND: 'Ресурс не найден',
    VALIDATION_ERROR: 'Ошибка валидации данных',
} as const;
