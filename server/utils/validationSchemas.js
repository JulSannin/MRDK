import { ALLOWED_PRIORITIES, isValidDate } from './validation.js';

/**
 * Централизованные правила валидации для повторяющихся полей
 * Позволяет избежать дублирования схем валидации в разных роутах
 */
export const COMMON_VALIDATION_RULES = {
    // Заголовки
    titleLong: { required: true, minLength: 3, maxLength: 255 },
    titleShort: { required: true, minLength: 1, maxLength: 200 },
    
    // Описания
    descriptionShort: { required: true, minLength: 10, maxLength: 500 },
    descriptionLong: { required: true, minLength: 20, maxLength: 5000 },
    descriptionOptional: { required: false, maxLength: 1000 },
    
    // Дата
    date: { required: true, type: 'date' },
    dateWithValidation: {
        required: true,
        type: 'date',
        validate: (value) => isValidDate(value),
        validateMessage: 'Некорректная дата',
    },
    
    // Категория
    category: { required: false, maxLength: 50 },
    
    // Приоритет
    priority: {
        required: false,
        validate: (value) => !value || ALLOWED_PRIORITIES.has(value),
        validateMessage: 'Некорректный приоритет',
    },
};

/**
 * Готовые схемы валидации для каждой сущности
 * Вместо дублирования схем в каждом роуте, используем централизованные версии
 */
export const VALIDATION_SCHEMAS = {
    event: {
        title: COMMON_VALIDATION_RULES.titleLong,
        shortDescription: COMMON_VALIDATION_RULES.descriptionShort,
        fullDescription: COMMON_VALIDATION_RULES.descriptionLong,
        date: COMMON_VALIDATION_RULES.date,
    },

    document: {
        title: COMMON_VALIDATION_RULES.titleShort,
        description: COMMON_VALIDATION_RULES.descriptionOptional,
        category: COMMON_VALIDATION_RULES.category,
    },

    reminder: {
        title: COMMON_VALIDATION_RULES.titleShort,
        description: COMMON_VALIDATION_RULES.descriptionLong,
        date: COMMON_VALIDATION_RULES.dateWithValidation,
        priority: COMMON_VALIDATION_RULES.priority,
    },

    workplan: {
        month: { required: true, minLength: 1, maxLength: 30 },
        year: {
            required: true,
            validate: (value) => {
                const yearNumber = Number(value);
                return Number.isInteger(yearNumber) && yearNumber >= 2000 && yearNumber <= 2100;
            },
            validateMessage: 'Некорректный год',
        },
        description: COMMON_VALIDATION_RULES.descriptionLong,
    },
};
