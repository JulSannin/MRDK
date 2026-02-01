const ruFormatter = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
});

/**
 * Форматирует дату в читабельный формат на русском языке
 * @param {string} value - Дата в формате ISO (yyyy-mm-dd) или любом другом
 * @returns {string} Отформатированная дата вида "10 декабря 2025" или исходное значение
 */
export function formatEventDate(value: string): string {
    if (!value) return value;

    // ISO формат yyyy-mm-dd
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        const date = new Date(Date.UTC(y, m - 1, d));
        if (!Number.isNaN(date.getTime())) {
            return ruFormatter.format(date).replace(/\s*г\.?$/u, '');
        }
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
        return ruFormatter.format(parsed).replace(/\s*г\.?$/u, '');
    }

    return value;
}
