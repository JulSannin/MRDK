import type { Event } from '../components/entities/types';

/**
 * Сортирует события по дате от новых к старым
 * @param {Event[]} events - Массив событий для сортировки
 * @returns {Event[]} Отсортированный массив событий
 */
export function sortEventsByDate(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // Если обе даты невалидны, сохраняем исходный порядок
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
        
        // Невалидные даты помещаем в конец
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        
        // Сортировка по убыванию (новые события сверху)
        return dateB - dateA;
    });
}
