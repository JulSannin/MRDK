import type { Route } from './+types/home';
import { useLoaderData } from 'react-router';
import EventGrid from '../components/main/events/EventGrid';
import { api } from '../utils/api';
import { sortEventsByDate } from '../utils/eventHelpers';
import { LATEST_EVENTS_COUNT } from '../config/constants';

/**
 * Мета-данные для главной страницы
 * @returns {Array} Массив мета-тегов
 */
export function meta({}: Route.MetaArgs) {
    return [
        { title: 'Мариинский районный дом культуры' },
        { name: 'description', content: 'Мариинский районный дом культуры' },
    ];
}

/**
 * Загрузка последних событий для главной страницы
 * @returns {Object} Объект с массивом событий
 */
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

/**
 * Главная страница с отображением последних событий
 * @returns {JSX.Element} React-компонент
 */
export default function Home() {
    const { events } = useLoaderData<typeof clientLoader>();
    return (
        <div className="m-[20px_0_20px_0]">
            <div className="bg-[#31393C]">
                <p className="text-white text-center p-[20px] text-[20px]">
                    Последние события
                </p>
                <EventGrid events={events} />
            </div>
        </div>
    );
}
