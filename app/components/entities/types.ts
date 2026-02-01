// Центральные TypeScript типы для всего приложения
//
// Event - тип для событий (новости, мероприятия)
// - Полное и краткое описание
// - Изображение (опционально)
// - Дата создания
//
// Document - тип для документов
// - Метаданные (название, описание, категория)
// - URL файла для скачивания
//
// Reminder - тип для памяток
// - Приоритет (high/medium/low)
// - Статус выполнения (0/1)
//
// WorkplanItem - тип для задач плана работы
// - Даты начала и окончания
// - Статус (planned/in-progress/completed/cancelled)
// - Ответственный (опционально)
//
// User - тип для пользователя (администратор)
// AuthResponse - ответ авторизации с токеном и данными пользователя

export interface Event {
    id: number;
    title: string;
    shortDescription: string;
    fullDescription: string;
    date: string;
    image: string | null;
    createdAt?: string;
}

export interface Document {
    id: number;
    title: string;
    description: string;
    fileUrl: string;
    category: string;
}

export interface Reminder {
    id: number;
    title: string;
    description: string;
    imageUrl?: string;
    date: string;
    priority?: 'high' | 'medium' | 'low';
    completed?: 0 | 1;
}

export interface WorkplanItem {
    id: number;
    month: string;
    year: number;
    description: string;
    fileUrl?: string;
}

export interface User {
    id: number;
    username: string;
    role?: 'admin' | 'user';
}

export interface AuthResponse {
    user: User;
}

export interface VerifyTokenResponse {
    valid: boolean;
    user?: User;
}

export interface DeleteResponse {
    success: boolean;
    message?: string;
}
