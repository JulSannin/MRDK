import { useState } from 'react';
import type { FormEvent } from 'react';
import { z } from 'zod';
import { api } from '../../../utils/api';
import { sortEventsByDate } from '../../../utils/eventHelpers';
import { buildFormData } from '../../../utils/formDataHelpers';
import type { Event } from '../../entities/types';
import { useManager } from '../../../hooks/useManager';
import Button from '../../shared/ui/Button';

type EventFormData = {
    title: string;
    fullDescription: string;
    date: string;
};

// Zod валидация для события
const eventFormSchema = z.object({
    title: z
        .string()
        .min(3, 'Название должно содержать минимум 3 символа')
        .max(255, 'Название не должно превышать 255 символов')
        .trim(),
    fullDescription: z
        .string()
        .min(20, 'Описание должно содержать минимум 20 символов')
        .max(5000, 'Описание не должно превышать 5000 символов'),
    date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Дата должна быть в формате YYYY-MM-DD'),
});

type EventFormInput = z.infer<typeof eventFormSchema>;

/** Компонент управления событиями */
export default function EventsManager() {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof EventFormInput, string>>>({});

    const buildShortDescription = (description: string) => {
        const words = description.trim().split(/\s+/).filter(Boolean);
        return words.slice(0, 20).join(' ');
    };

    const manager = useManager<Event, typeof initialFormData>({
        initialFormData: {
            title: '',
            fullDescription: '',
            date: '',
        },
        loadFn: api.getEvents,
        createFn: async (data: EventFormData) => {
            const shortDescription = buildShortDescription(data.fullDescription);
            const formData = buildFormData(
                {
                    title: data.title,
                    shortDescription,
                    fullDescription: data.fullDescription,
                    date: data.date,
                },
                { image: imageFile }
            );
            return api.createEvent(formData);
        },
        updateFn: async (id: number, data: EventFormData) => {
            const shortDescription = buildShortDescription(data.fullDescription);
            const formData = buildFormData(
                {
                    title: data.title,
                    shortDescription,
                    fullDescription: data.fullDescription,
                    date: data.date,
                },
                { image: imageFile }
            );
            return api.updateEvent(id, formData);
        },
        deleteFn: api.deleteEvent,
        successMessages: {
            create: 'Событие успешно создано',
            update: 'Событие успешно обновлено',
            delete: 'Событие успешно удалено',
        },
    });

    const validateForm = () => {
        setValidationErrors({});
        const result = eventFormSchema.safeParse({
            title: manager.formData.title,
            fullDescription: manager.formData.fullDescription,
            date: manager.formData.date,
        });

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const errors: Partial<Record<keyof EventFormInput, string>> = {};
            if (fieldErrors.title?.[0]) errors.title = fieldErrors.title[0];
            if (fieldErrors.fullDescription?.[0]) errors.fullDescription = fieldErrors.fullDescription[0];
            if (fieldErrors.date?.[0]) errors.date = fieldErrors.date[0];
            setValidationErrors(errors);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setSubmitting(true);
        try {
            await manager.handleSubmit(manager.formData);
            setImageFile(null);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        manager.resetForm();
        setImageFile(null);
    };

    if (manager.loading) return <div>Загрузка...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Управление событиями</h2>
                <button
                    onClick={() => manager.setShowForm(!manager.showForm)}
                    aria-label={manager.showForm ? 'Отменить создание события' : 'Открыть форму создания события'}
                    className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                >
                    {manager.showForm ? 'Отмена' : '+ Добавить событие'}
                </button>
            </div>

            {manager.showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-xl font-semibold mb-4">
                        {manager.editingItem ? 'Редактировать событие' : 'Новое событие'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Название</label>
                            <input
                                type="text"
                                value={manager.formData.title}
                                onChange={(e) => manager.setField('title', e.target.value)}
                                required
                                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                                    validationErrors.title ? 'border-red-500' : ''
                                }`}
                                aria-invalid={!!validationErrors.title}
                            />
                            {validationErrors.title && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Описание</label>
                            <textarea
                                value={manager.formData.fullDescription}
                                onChange={(e) => manager.setField('fullDescription', e.target.value)}
                                required
                                rows={4}
                                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                                    validationErrors.fullDescription ? 'border-red-500' : ''
                                }`}
                                aria-invalid={!!validationErrors.fullDescription}
                            />
                            {validationErrors.fullDescription && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.fullDescription}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Дата</label>
                            <input
                                type="date"
                                value={manager.formData.date}
                                onChange={(e) => manager.setField('date', e.target.value)}
                                required
                                className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                                    validationErrors.date ? 'border-red-500' : ''
                                }`}
                                aria-invalid={!!validationErrors.date}
                            />
                            {validationErrors.date && (
                                <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Изображение</label>
                            <div className="flex items-center gap-3">
                                <input
                                    id="event-image"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    className="sr-only"
                                />
                                <label
                                    htmlFor="event-image"
                                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                                >
                                    Загрузить изображение
                                </label>
                                <span className="text-sm text-gray-600">
                                    {imageFile ? imageFile.name : 'Файл не выбран'}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={submitting}
                            >
                                {submitting ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button
                                type="button"
                                onClick={resetForm}
                                variant="secondary"
                                disabled={submitting}
                            >
                                Отмена
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {sortEventsByDate(manager.items).map((event) => (
                    <div key={event.id} className="bg-white p-4 sm:p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold break-words">{event.title}</h3>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{event.shortDescription}</p>
                            <p className="text-gray-500 text-xs mt-2">{event.date}</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => manager.handleEdit(event)}
                                variant="warning"
                                className="px-3 py-1 text-xs sm:text-sm w-full sm:w-auto"
                            >
                                Изменить
                            </Button>
                            <Button
                                onClick={() => manager.handleDelete(event.id)}
                                variant="danger"
                                className="px-3 py-1 text-xs sm:text-sm w-full sm:w-auto"
                            >
                                Удалить
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const initialFormData = {
    title: '',
    fullDescription: '',
    date: '',
};
