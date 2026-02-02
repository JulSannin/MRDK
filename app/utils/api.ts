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

// API client for backend communication
export const api = {
    // Events
    getEvents: async (signal?: AbortSignal): Promise<Event[]> => {
        return apiFetch<Event[]>(`${API_URL}/events`, { signal });
    },

    getEvent: async (id: number, signal?: AbortSignal): Promise<Event> => {
        return apiFetch<Event>(`${API_URL}/events/${id}`, { signal });
    },

    createEvent: async (data: FormData): Promise<Event> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Event>(`${API_URL}/events`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    updateEvent: async (id: number, data: FormData): Promise<Event> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Event>(`${API_URL}/events/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    deleteEvent: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/events/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    // Documents
    getDocuments: async (signal?: AbortSignal): Promise<Document[]> => {
        return apiFetch<Document[]>(`${API_URL}/documents`, { signal });
    },

    createDocument: async (data: FormData): Promise<Document> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Document>(`${API_URL}/documents`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    updateDocument: async (id: number, data: FormData): Promise<Document> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Document>(`${API_URL}/documents/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    deleteDocument: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/documents/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    // Reminders
    getReminders: async (signal?: AbortSignal): Promise<Reminder[]> => {
        return apiFetch<Reminder[]>(`${API_URL}/reminders`, { signal });
    },

    createReminder: async (data: FormData): Promise<Reminder> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Reminder>(`${API_URL}/reminders`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    updateReminder: async (id: number, data: FormData): Promise<Reminder> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<Reminder>(`${API_URL}/reminders/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    deleteReminder: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/reminders/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    // Workplan
    getWorkplan: async (signal?: AbortSignal): Promise<WorkplanItem[]> => {
        return apiFetch<WorkplanItem[]>(`${API_URL}/workplan`, { signal });
    },

    createWorkplanItem: async (data: FormData): Promise<WorkplanItem> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<WorkplanItem>(`${API_URL}/workplan`, 
            addCSRFHeaders({ method: 'POST', body: data }, csrfToken)
        );
    },

    updateWorkplanItem: async (id: number, data: FormData): Promise<WorkplanItem> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<WorkplanItem>(`${API_URL}/workplan/${id}`, 
            addCSRFHeaders({ method: 'PUT', body: data }, csrfToken)
        );
    },

    deleteWorkplanItem: async (id: number): Promise<{ success: boolean }> => {
        const csrfToken = await getCSRFToken();
        return apiFetch<{ success: boolean }>(`${API_URL}/workplan/${id}`, 
            addCSRFHeaders({ method: 'DELETE' }, csrfToken)
        );
    },

    // Auth
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
