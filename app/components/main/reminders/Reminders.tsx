import { useLoaderData } from 'react-router';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../../utils/api';
import type { Reminder } from '../../entities/types';
import { createDataLoader } from '../../../utils/loaderFactory';

/** Мета-данные для страницы памяток */
export function meta() {
    return [{ title: 'Памятки' }];
}

/** Загрузка памяток */
export const clientLoader = createDataLoader(api.getReminders, 'reminders');

/** Страница с памятками */
export default function Reminders() {
    const { reminders } = useLoaderData<{ reminders: Reminder[] }>();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement | null>(null);

    const getImageUrl = (url: string | null | undefined): string => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `https://backend-production-190b.up.railway.app${url}`;
    };

    useEffect(() => {
        if (selectedImage && modalRef.current) {
            modalRef.current.focus();
        }
    }, [selectedImage]);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Памятки</h1>

            {reminders.length === 0 ? (
                <p className="text-gray-600">Памяток пока нет</p>
            ) : (
                <div className="space-y-4">
                    {reminders.map((reminder) => (
                        <div
                            key={reminder.id}
                            role={reminder.imageUrl ? "button" : undefined}
                            tabIndex={reminder.imageUrl ? 0 : undefined}
                            onClick={reminder.imageUrl ? () => setSelectedImage(getImageUrl(reminder.imageUrl)) : undefined}
                            onKeyDown={reminder.imageUrl ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setSelectedImage(getImageUrl(reminder.imageUrl));
                                }
                            } : undefined}
                            className={`bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-blue-500 ${
                                reminder.imageUrl ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
                            }`}
                        >
                            <h3 className="text-lg font-semibold mb-2">{reminder.title}</h3>
                            {reminder.date && (
                                <p className="text-gray-500 text-sm mb-1">{reminder.date}</p>
                            )}
                            <p className="text-gray-700">{reminder.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {selectedImage && (
                <div
                    className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedImage(null)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSelectedImage(null);
                    }}
                    role="dialog"
                    aria-modal="true"
                    tabIndex={0}
                    ref={modalRef}
                >
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-white rounded"
                        aria-label="Закрыть"
                    >
                        ×
                    </button>
                    <img
                        src={selectedImage}
                        alt="Памятка"
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
