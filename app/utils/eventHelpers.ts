import type { Event } from '../components/entities/types';

// Sort events by date (newest first)
export function sortEventsByDate(events: Event[]): Event[] {
    return [...events].sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
        if (Number.isNaN(dateA)) return 1;
        if (Number.isNaN(dateB)) return -1;
        
        return dateB - dateA;
    });
}
