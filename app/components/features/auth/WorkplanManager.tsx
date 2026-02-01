import { useState, type FormEvent } from 'react';
import { api } from '../../../utils/api';
import { buildFormData } from '../../../utils/formDataHelpers';
import type { WorkplanItem } from '../../entities/types';
import { useManager } from '../../../hooks/useManager';
import Button from '../../shared/ui/Button';

/** Компонент управления планом работы */
export default function WorkplanManager() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const manager = useManager<WorkplanItem, typeof initialFormData>({
        initialFormData: {
            month: '',
            year: new Date().getFullYear(),
            description: '',
        },
        loadFn: api.getWorkplan,
        validationSchema: {
            month: { required: true, minLength: 1, maxLength: 30 },
            year: { required: true, type: 'number', min: 2000, max: 2100 },
            description: { required: true, minLength: 1, maxLength: 5000 },
        },
        createFn: async (data: FormData) => api.createWorkplanItem(data),
        updateFn: async (id: number, data: FormData) => api.updateWorkplanItem(id, data),
        deleteFn: api.deleteWorkplanItem,
        successMessages: {
            create: 'Элемент плана успешно создан',
            update: 'Элемент плана успешно обновлён',
            delete: 'Элемент плана успешно удалён',
        },
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        const formData = buildFormData(
            {
                month: manager.formData.month,
                year: manager.formData.year,
                description: manager.formData.description,
            },
            { file: selectedFile }
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
                <h2 className="text-2xl font-bold">Управление планом работы</h2>
                <button
                    onClick={() => manager.setShowForm(!manager.showForm)}
                    aria-label={manager.showForm ? 'Отменить создание записи' : 'Открыть форму создания записи в плане работы'}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    {manager.showForm ? 'Отмена' : '+ Добавить запись'}
                </button>
            </div>

            {manager.showForm && (
                <div className="bg-white p-6 rounded-lg shadow mb-6">
                    <h3 className="text-xl font-semibold mb-4">
                        {manager.editingItem ? 'Редактировать запись' : 'Новая запись'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Месяц</label>
                                <select
                                    value={manager.formData.month}
                                    onChange={(e) => manager.setFormData({ ...manager.formData, month: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Выберите месяц</option>
                                    <option value="Январь">Январь</option>
                                    <option value="Февраль">Февраль</option>
                                    <option value="Март">Март</option>
                                    <option value="Апрель">Апрель</option>
                                    <option value="Май">Май</option>
                                    <option value="Июнь">Июнь</option>
                                    <option value="Июль">Июль</option>
                                    <option value="Август">Август</option>
                                    <option value="Сентябрь">Сентябрь</option>
                                    <option value="Октябрь">Октябрь</option>
                                    <option value="Ноябрь">Ноябрь</option>
                                    <option value="Декабрь">Декабрь</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Год</label>
                                <input
                                    type="number"
                                    value={manager.formData.year}
                                    onChange={(e) => manager.setFormData({ ...manager.formData, year: Number(e.target.value) })}
                                    required
                                    min="2020"
                                    max="2100"
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Файл плана</label>
                            <input
                                type="file"
                                accept=".pdf,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Описание мероприятий</label>
                            <textarea
                                value={manager.formData.description}
                                onChange={(e) => manager.setFormData({ ...manager.formData, description: e.target.value })}
                                required
                                rows={4}
                                placeholder="Перечислите основные мероприятия месяца..."
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
                {manager.items.map((item) => (
                    <div key={item.id} className="bg-white p-4 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-2">{item.month} {item.year}</h3>
                                <p className="text-gray-600 text-sm">{item.description}</p>
                            </div>
                            <div className="flex gap-2 ml-4">
                                <Button
                                    onClick={() => manager.handleEdit(item)}
                                    variant="warning"
                                    className="px-3 py-1"
                                >
                                    Изменить
                                </Button>
                                <Button
                                    onClick={() => manager.handleDelete(item.id)}
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

const initialFormData = {
    month: '',
    year: new Date().getFullYear(),
    description: '',
};
