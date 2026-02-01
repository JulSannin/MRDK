import { useLoaderData } from 'react-router';
import EventItem from '../components/main/events/EventItem';
import { api } from '../utils/api';
import type { Route } from './+types/event';

/**
 * Загрузка данных конкретного события по ID
 * @returns {Object} Объект с данными события
 */
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    try {
        const event = await api.getEvent(Number(params.eventId));
        return { event };
    } catch (error) {
        throw new Response('Событие не найдено', { status: 404 });
    }
}

/**
 * Страница отдельного события
 * @returns {JSX.Element} React-компонент
 */
export default function Event() {
    const { event } = useLoaderData<typeof clientLoader>();
    return <EventItem event={event} />;
}
