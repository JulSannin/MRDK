import { useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import EventCard from './EventCard';
import { api } from '../../../utils/api';
import { sortEventsByDate } from '../../../utils/eventHelpers';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import type { Event } from '../../entities/types';

/** Получить количество карточек в зависимости от ширины экрана */
function getEventsPerPage(width: number): number {
    if (width >= 1024) return 12; // xl и больше - десктоп
    if (width >= 640) return 8;   // sm и больше - планшет
    return 6;                       // мобильный
}

/** Мета-данные для страницы событий */
export function meta() {
    return [{ title: 'Наши события' }];
}

/** Загрузка всех событий */
export async function clientLoader() {
    try {
        const events = await api.getEvents();
        const sortedEvents = sortEventsByDate(events);
        return { events: sortedEvents };
    } catch (error) {
        return { events: [] };
    }
}

/** Страница со списком событий */
export default function Events() {
    const { events } = useLoaderData<{ events: Event[] }>();
    const [currentPage, setCurrentPage] = useState(1);
    const windowWidth = useWindowWidth();
    
    const eventsPerPage = useMemo(() => getEventsPerPage(windowWidth), [windowWidth]);

    useEffect(() => {
        const newTotalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
        if (currentPage > newTotalPages) {
            setCurrentPage(1);
        }
    }, [events.length, eventsPerPage, currentPage]);

    const totalPages = Math.ceil(events.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const currentEvents = events.slice(startIndex, endIndex);

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (events.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-gray-500 text-lg">Событий пока нет</p>
                    <p className="text-gray-400 text-sm mt-2">Проверьте позже</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex flex-wrap justify-start md:justify-center xl:justify-start max-w-[300px] md:max-w-[830px] xl:max-w-[1260px] gap-[30px] m-auto mt-[30px] mb-[30px]">
                {currentEvents.map((event) => (
                    <EventCard
                        key={event.id}
                        id={event.id}
                        title={event.title}
                        shortDescription={event.shortDescription}
                        date={event.date}
                        image={event.image || ''}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2 mb-[60px] px-4">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded bg-[#2176FF] text-white hover:bg-[#1a5acc] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        aria-label="Предыдущая страница"
                    >
                        ← Назад
                    </button>

                    <div className="flex flex-wrap justify-center gap-1 max-w-full">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-9 h-9 sm:w-10 sm:h-10 rounded transition-colors ${
                                    page === currentPage
                                        ? 'bg-[#2176FF] text-white font-bold'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                                aria-label={`Страница ${page}`}
                                aria-current={page === currentPage ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 rounded bg-[#2176FF] text-white hover:bg-[#1a5acc] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        aria-label="Следующая страница"
                    >
                        Вперёд →
                    </button>
                </div>
            )}
        </div>
    );
}
