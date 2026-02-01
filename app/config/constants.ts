/** Базовый URL API */
export const API_URL = import.meta.env.VITE_API_URL || '/api';

/** Количество последних событий на главной */
export const LATEST_EVENTS_COUNT = 6;

/** Минимальная длина имени пользователя */
export const MIN_USERNAME_LENGTH = 3;

/** Минимальная длина пароля */
export const MIN_PASSWORD_LENGTH = 5;

/** Минимальная длина заголовка */
export const TITLE_MIN_LENGTH = 3;

/** Максимальная длина заголовка */
export const TITLE_MAX_LENGTH = 255;

/** Максимальная длина описания */
export const DESCRIPTION_MAX_LENGTH = 5000;

/** Максимальная длина имени */
export const NAME_MAX_LENGTH = 255;

/** Максимальная длина email */
export const EMAIL_MAX_LENGTH = 255;

/** Доступные категории документов */
export const DOCUMENT_CATEGORIES = [
    'Уставные документы',
    'Положение о организации',
    'Должностные инструкции',
    'Приказы',
    'Отчеты',
    'Финансовые документы',
    'Планы и программы',
    'Прочие',
] as const;

