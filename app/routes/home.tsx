import type { Route } from './+types/home';
import { useLoaderData } from 'react-router';
import { Suspense } from 'react';
import EventGrid from '../components/main/events/EventGrid';
import { api } from '../utils/api';
import { sortEventsByDate } from '../utils/eventHelpers';
import { LATEST_EVENTS_COUNT } from '../config/constants';
import LoadingFallback from '../components/shared/ui/LoadingFallback';

// Home page metadata
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Мариинский районный дом культуры' },
        { name: 'description', content: 'Мариинский районный дом культуры' },
    ];
}

// Load latest events for home page
export async function clientLoader() {
    try {
        const events = await api.getEvents();
        const sortedEvents = sortEventsByDate(events);
        const latestEvents = sortedEvents.slice(0, LATEST_EVENTS_COUNT);
        return { events: latestEvents };
    } catch (error) {
        return { events: [] };
    }
}

// Home page with latest events
export default function Home() {
    const { events } = useLoaderData<typeof clientLoader>();
    return (
        <div className="m-[20px_0_20px_0]">
            <div className="app-bg-dark">
                <p className="text-white text-center p-[20px] text-[20px]">
                    Последние события
                </p>
                <Suspense fallback={<LoadingFallback />}>
                    <EventGrid events={events} />
                </Suspense>
            </div>
        </div>
    );
}
