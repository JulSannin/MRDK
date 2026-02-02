/**
 * Проверяет корректность даты
 * @param {string} value - Дата в формате строки
 * @returns {boolean} true если дата валидна
 */
export const isValidDate = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

/** Допустимые значения приоритета для памяток */
export const ALLOWED_PRIORITIES = new Set(['high', 'medium', 'low']);
