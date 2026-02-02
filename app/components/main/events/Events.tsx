import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLoaderData } from 'react-router';
import EventCard from './EventCard';
import { api } from '../../../utils/api';
import { sortEventsByDate } from '../../../utils/eventHelpers';
import { useWindowWidth } from '../../../hooks/useWindowWidth';
import { useNotification } from '../../../contexts/NotificationContext';
import type { Event } from '../../entities/types';

// Calculate cards per row based on screen width
function getEventsPerPage(width: number): number {
    if (width >= 1024) return 12; // xl and bigger - desktop
    if (width >= 640) return 8;   // sm and bigger - tablet
    return 6;                       // mobile
}

// Events page metadata
export function meta() {
    return [{ title: 'Наши события' }];
}

// Load all events
export async function clientLoader() {
    try {
        const events = await api.getEvents();
        const sortedEvents = sortEventsByDate(events);
        return { events: sortedEvents };
    } catch (error) {
        return { events: [], error: true };
    }
}

// Events page with pagination
export default function Events() {
    const loaderData = useLoaderData<{ events: Event[]; error?: boolean }>();
    const [currentPage, setCurrentPage] = useState(1);
    const [events, setEvents] = useState(loaderData.events);
    const [error, setError] = useState(loaderData.error ?? false);
    const [loading, setLoading] = useState(false);
    const windowWidth = useWindowWidth();
    const { showError } = useNotification();
    
    const eventsPerPage = useMemo(() => getEventsPerPage(windowWidth), [windowWidth]);

    useEffect(() => {
        const newTotalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
        if (currentPage > newTotalPages) {
            setCurrentPage(1);
        }
    }, [events.length, eventsPerPage, currentPage]);

    const handleRetry = async () => {
        setLoading(true);
        setError(false);
        try {
            const newEvents = await api.getEvents();
            const sortedEvents = sortEventsByDate(newEvents);
            setEvents(sortedEvents);
        } catch (err) {
            setError(true);
            showError('Не удалось загрузить события. Пожалуйста, проверьте соединение и попробуйте снова.');
        } finally {
            setLoading(false);
        }
    };

    const totalPages = useMemo(
        () => Math.ceil(events.length / eventsPerPage),
        [events.length, eventsPerPage]
    );

    const currentEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * eventsPerPage;
        const endIndex = startIndex + eventsPerPage;
        return events.slice(startIndex, endIndex);
    }, [currentPage, events, eventsPerPage]);

    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage, totalPages]);

    const goToPrevPage = useCallback(() => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [currentPage]);

    const goToPage = useCallback((page: number) => {
        setCurrentPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <p className="text-red-600 text-lg font-semibold mb-4">Ошибка загрузки событий</p>
                    <p className="text-gray-600 text-sm mb-6">Не удалось загрузить список событий. Пожалуйста, проверьте соединение.</p>
                    <button
                        onClick={handleRetry}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-busy={loading}
                    >
                        {loading ? 'Повторная загрузка...' : 'Попробовать снова'}
                    </button>
                </div>
            </div>
        );
    }

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
                        className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
                            currentPage === 1 ? '' : 'app-bg-primary app-hover-primary'
                        }`}
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
                                        ? 'text-white font-bold app-bg-primary'
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
                        className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors ${
                            currentPage === totalPages ? '' : 'app-bg-primary app-hover-primary'
                        }`}
                        aria-label="Следующая страница"
                    >
                        Вперёд →
                    </button>
                </div>
            )}
        </div>
    );
}
