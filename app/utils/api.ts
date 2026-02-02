import { ApiError, AUTH_ERRORS, COMMON_ERRORS } from './errorHandler';
import { API_URL } from '../config/constants';
import type { Event, Document, Reminder, WorkplanItem, AuthResponse, VerifyTokenResponse } from '../components/entities/types';

let cachedCSRFToken: string | null = null;
let csrfTokenFetchedAt = 0;
const CSRF_TOKEN_TTL_MS = 5 * 60 * 1000;

function clearCSRFTokenCache() {
    cachedCSRFToken = null;
    csrfTokenFetchedAt = 0;
}

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage: string;
        let errorData: unknown = null;

        try {
            errorData = await response.clone().json();
        } catch {
            errorData = null;
        }
        
        const normalizedError = typeof errorData === 'object' && errorData !== null
            ? (errorData as { message?: string; error?: string; code?: string })
            : null;

        switch (response.status) {
            case 401:
                errorMessage = AUTH_ERRORS.UNAUTHORIZED;
                break;
            case 403:
                errorMessage = AUTH_ERRORS.FORBIDDEN;
                break;
            case 404:
                errorMessage = COMMON_ERRORS.NOT_FOUND;
                break;
            case 500:
            case 502:
            case 503:
                errorMessage = COMMON_ERRORS.SERVER_ERROR;
                break;
            default:
                errorMessage =
                    normalizedError?.message ||
                    normalizedError?.error ||
                    `Ошибка: ${response.status}`;
        }

        if (response.status === 403) {
            if (
                normalizedError?.code === 'EBADCSRFTOKEN' ||
                (normalizedError?.error && String(normalizedError.error).toLowerCase().includes('csrf token'))
            ) {
                clearCSRFTokenCache();
                errorMessage = 'Сессия устарела. Обновите страницу и повторите действие';
            }
        }
        
        throw new ApiError(errorMessage, response.status);
    }
    
    return response.json();
}

function handleNetworkError(error: unknown): never {
    if (error instanceof ApiError) {
        throw error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(COMMON_ERRORS.NETWORK_ERROR);
    }
    
    throw new ApiError(
        error instanceof Error ? error.message : COMMON_ERRORS.SERVER_ERROR
    );
}

async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
    retries = 3,
    timeoutMs = 30000
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const method = (options.method || 'GET').toUpperCase();
    const canRetry = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';
    const externalSignal = options.signal;

    if (externalSignal) {
        if (externalSignal.aborted) {
            controller.abort();
        } else {
            externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
        }
    }

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return handleResponse<T>(response);
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Timeout или abort error
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw new ApiError(`Запрос истёк. Пожалуйста, проверьте соединение и попробуйте снова`);
        }

        const isNetworkError = error instanceof TypeError;

        // Retry только для идемпотентных запросов и сетевых ошибок
        if (retries > 0 && canRetry && isNetworkError) {
            // Exponential backoff: 1s, 2s, 4s
            const delay = Math.pow(2, 3 - retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return apiFetch<T>(url, options, retries - 1, timeoutMs);
        }
        handleNetworkError(error);
    }
}

async function getCSRFToken(): Promise<string> {
    try {
        const now = Date.now();
        if (cachedCSRFToken && now - csrfTokenFetchedAt < CSRF_TOKEN_TTL_MS) {
            return cachedCSRFToken;
        }
        const data = await apiFetch<{ csrfToken: string }>(`${API_URL}/auth/csrf-token`);
        cachedCSRFToken = data.csrfToken;
        csrfTokenFetchedAt = Date.now();
        return data.csrfToken;
    } catch {
        // CSRF токен опционален, если не получился - продолжаем
        return '';
    }
}

function addCSRFHeaders(options: RequestInit, csrfToken: string): RequestInit {
    if (csrfToken && ['POST', 'PUT', 'DELETE'].includes(options.method || '')) {
        return {
            ...options,
            headers: {
                ...((options.headers as Record<string, string>) || {}),
                'X-CSRF-Token': csrfToken,
            },
        };
    }
    return options;
}

/**
 * API клиент для взаимодействия с бэкендом
 * Предоставляет методы для работы с событиями, документами, памятками, планом работы и авторизацией
 */
export const api = {
    /**
     * Получает список всех событий
     * @returns {Promise<Event[]>} Массив событий
     */
    getEvents: async (signal?: AbortSignal): Promise<Event[]> => {
        return apiFetch<Event[]>(`${API_URL}/events`, { signal });
    },

    /**
     * Получает событие по ID
     * @param {number} id - ID события
     * @returns {Promise<Event>} Объект события
     */
    getEvent: async (id: number, signal?: AbortSignal): Promise<Event> => {
        return apiFetch<Event>(`${API_URL}/events/${id}`, { signal });
    },

    /**
     * Создает новое событие
     * @param {FormData} data - Данные события в FormData
     * @returns {Promise<Event>} Созданное событие
     */
    createEvent: async (data: FormData): Promise<Event> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Event>(`${API_URL}/events`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    /**
     * Обновляет существующее событие
     * @param {number} id - ID события
     * @param {FormData} data - Обновленные данные в FormData
     * @returns {Promise<Event>} Обновленное событие
     */
    updateEvent: async (id: number, data: FormData): Promise<Event> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Event>(`${API_URL}/events/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    /**
     * Удаляет событие
     * @param {number} id - ID события
     * @returns {Promise<{success: boolean}>} Результат удаления
     */
    deleteEvent: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/events/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    /**
     * Получает список всех документов
     * @returns {Promise<Document[]>} Массив документов
     */
    getDocuments: async (signal?: AbortSignal): Promise<Document[]> => {
        return apiFetch<Document[]>(`${API_URL}/documents`, { signal });
    },

    /**
     * Создает новый документ
     * @param {FormData} data - Данные документа в FormData
     * @returns {Promise<Document>} Созданный документ
     */
    createDocument: async (data: FormData): Promise<Document> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Document>(`${API_URL}/documents`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    /**
     * Обновляет существующий документ
     * @param {number} id - ID документа
     * @param {FormData} data - Обновленные данные в FormData
     * @returns {Promise<Document>} Обновленный документ
     */
    updateDocument: async (id: number, data: FormData): Promise<Document> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Document>(`${API_URL}/documents/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    /**
     * Удаляет документ
     * @param {number} id - ID документа
     * @returns {Promise<{success: boolean}>} Результат удаления
     */
    deleteDocument: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/documents/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    /**
     * Получает список всех памяток
     * @returns {Promise<Reminder[]>} Массив памяток
     */
    getReminders: async (signal?: AbortSignal): Promise<Reminder[]> => {
        return apiFetch<Reminder[]>(`${API_URL}/reminders`, { signal });
    },

    /**
     * Создает новую памятку
     * @param {FormData} data - Данные памятки в FormData
     * @returns {Promise<Reminder>} Созданная памятка
     */
    createReminder: async (data: FormData): Promise<Reminder> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Reminder>(`${API_URL}/reminders`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    /**
     * Обновляет существующую памятку
     * @param {number} id - ID памятки
     * @param {FormData} data - Обновленные данные в FormData
     * @returns {Promise<Reminder>} Обновленная памятка
     */
    updateReminder: async (id: number, data: FormData): Promise<Reminder> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Reminder>(`${API_URL}/reminders/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    /**
     * Удаляет памятку
     * @param {number} id - ID памятки
     * @returns {Promise<{success: boolean}>} Результат удаления
     */
    deleteReminder: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/reminders/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    /**
     * Получает план работы
     * @returns {Promise<WorkplanItem[]>} Массив элементов плана работы
     */
    getWorkplan: async (signal?: AbortSignal): Promise<WorkplanItem[]> => {
        return apiFetch<WorkplanItem[]>(`${API_URL}/workplan`, { signal });
    },

    /**
     * Создает новый элемент плана работы
     * @param {FormData} data - Данные элемента в FormData
     * @returns {Promise<WorkplanItem>} Созданный элемент
     */
    createWorkplanItem: async (data: FormData): Promise<WorkplanItem> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<WorkplanItem>(`${API_URL}/workplan`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    /**
     * Обновляет элемент плана работы
     * @param {number} id - ID элемента
     * @param {FormData} data - Обновленные данные в FormData
     * @returns {Promise<WorkplanItem>} Обновленный элемент
     */
    updateWorkplanItem: async (id: number, data: FormData): Promise<WorkplanItem> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<WorkplanItem>(`${API_URL}/workplan/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    /**
     * Удаляет элемент плана работы
     * @param {number} id - ID элемента
     * @returns {Promise<{success: boolean}>} Результат удаления
     */
    deleteWorkplanItem: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/workplan/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    /**
     * Выполняет вход пользователя
     * @param {string} username - Имя пользователя
     * @param {string} password - Пароль
     * @returns {Promise<AuthResponse>} Ответ авторизации
     */
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<AuthResponse>(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
            },
            body: JSON.stringify({ username, password }),
        });
    },

    /**
     * Проверяет валидность токена авторизации
     * @returns {Promise<VerifyTokenResponse>} Результат проверки токена
     */
    verifyToken: async (signal?: AbortSignal): Promise<VerifyTokenResponse> => {
        try {
            return await apiFetch<VerifyTokenResponse>(`${API_URL}/auth/verify`, { signal });
        } catch (error) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
                return { valid: false };
            }
            return { valid: false };
        }
    },

    /**
     * Выполняет выход пользователя
     * @returns {Promise<{success: boolean}>} Результат выхода
     */
    logout: async (): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        try {
            return apiFetch<{ success: boolean }>(`${API_URL}/auth/logout`, 
                addCSRFHeaders({ method: 'POST' }, csrfToken)
            );
        } finally {
            clearCSRFTokenCache();
        }
    },
};
