import { useState, type FormEvent } from 'react';
import { api } from '../../../utils/api';
import { buildFormData } from '../../../utils/formDataHelpers';
import type { Reminder } from '../../entities/types';
import { useManager } from '../../../hooks/useManager';
import Button from '../../shared/ui/Button';

const initialFormData = {
    title: '',
    description: '',
    date: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
};

/** Компонент управления памятками */
export default function RemindersManager() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    
    const manager = useManager<Reminder, typeof initialFormData>({
        initialFormData,
        loadFn: api.getReminders,
        validationSchema: {
            title: { required: true, minLength: 1, maxLength: 200 },
            description: { required: true, minLength: 1, maxLength: 5000 },
            date: { required: true, type: 'date' },
        },
        createFn: async (data: FormData) => api.createReminder(data),
        updateFn: async (id: number, data: FormData) => api.updateReminder(id, data),
        deleteFn: api.deleteReminder,
        successMessages: {
            create: 'Памятка успешно создана',
            update: 'Памятка успешно обновлена',
            delete: 'Памятка успешно удалена',
        },
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        const formData = buildFormData(
            {
                title: manager.formData.title,
                description: manager.formData.description,
                date: manager.formData.date,
                priority: manager.formData.priority,
            },
            { image: selectedFile }
        );
        
        await manager.handleSubmit(formData);
        setSelectedFile(null);
    };

    const handleReset = () => {
        manager.resetForm();
        setSelectedFile(null);
    };

    if (manager.loading) return <div>Загрузка...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Управление памятками</h2>
                <button
                    onClick={() => manager.setShowForm(!manager.showForm)}
                    aria-label={manager.showForm ? 'Отменить создание памятки' : 'Открыть форму создания памятки'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {manager.showForm ? 'Отмена' : '+ Добавить памятку'}
                </button>
            </div>

            {manager.showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-xl font-semibold mb-4">
                        {manager.editingItem ? 'Редактировать памятку' : 'Новая памятка'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Название</label>
                            <input
                                type="text"
                                value={manager.formData.title}
                                onChange={(e) => manager.setFormData({ ...manager.formData, title: e.target.value })}
                                required
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Описание</label>
                            <textarea
                                value={manager.formData.description}
                                onChange={(e) => manager.setFormData({ ...manager.formData, description: e.target.value })}
                                required
                                rows={4}
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Дата</label>
                            <input
                                type="date"
                                value={manager.formData.date}
                                onChange={(e) => manager.setFormData({ ...manager.formData, date: e.target.value })}
                                required
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Приоритет</label>
                            <select
                                value={manager.formData.priority}
                                onChange={(e) => manager.setFormData({ ...manager.formData, priority: e.target.value as 'high' | 'medium' | 'low' })}
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="high">Высокий</option>
                                <option value="medium">Средний</option>
                                <option value="low">Низкий</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Изображение</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" variant="primary">
                                Сохранить
                            </Button>
                            <Button
                                type="button"
                                onClick={handleReset}
                                variant="secondary"
                            >
                                Отмена
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {manager.items.map((reminder) => (
                    <div key={reminder.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{reminder.title}</h3>
                                <p className="text-gray-600 text-sm">{reminder.description}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <Button
                                    onClick={() => manager.handleEdit(reminder)}
                                    variant="warning"
                                    className="px-3 py-1"
                                >
                                    Изменить
                                </Button>
                                <Button
                                    onClick={() => manager.handleDelete(reminder.id)}
                                    variant="danger"
                                    className="px-3 py-1"
                                >
                                    Удалить
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
