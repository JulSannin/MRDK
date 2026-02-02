import { useLoaderData } from 'react-router';
import EventItem from '../components/main/events/EventItem';
import { api } from '../utils/api';
import type { Route } from './+types/event';

// Load event by ID
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
    try {
        const event = await api.getEvent(Number(params.eventId));
        return { event };
    } catch (error) {
        throw new Response('Событие не найдено', { status: 404 });
    }
}

// Single event page
export default function Event() {
    const { event } = useLoaderData<typeof clientLoader>();
    return <EventItem event={event} />;
}
