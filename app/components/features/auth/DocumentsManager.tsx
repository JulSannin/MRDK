import { useState } from 'react';
import type { FormEvent } from 'react';
import { api } from '../../../utils/api';
import { DOCUMENT_CATEGORIES } from '../../../config/constants';
import { buildFormData } from '../../../utils/formDataHelpers';
import type { Document } from '../../entities/types';
import { useManager } from '../../../hooks/useManager';
import Button from '../../shared/ui/Button';

type DocumentFormData = {
    title: string;
    description: string;
    category: string;
};

/** Компонент управления документами */
export default function DocumentsManager() {
    const [file, setFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const manager = useManager<Document, typeof initialFormData>({
        initialFormData: {
            title: '',
            description: '',
            category: '',
        },
        loadFn: api.getDocuments,
        validationSchema: {
            title: { required: true, minLength: 1, maxLength: 200 },
            description: { required: false, maxLength: 1000 },
            category: { required: false, maxLength: 50 },
        },
        createFn: async (data: DocumentFormData) => {
            const formData = buildFormData(
                {
                    title: data.title,
                    description: data.description,
                    category: data.category,
                },
                { file }
            );
            return api.createDocument(formData);
        },
        updateFn: async (id: number, data: DocumentFormData) => {
            const formData = buildFormData(
                {
                    title: data.title,
                    description: data.description,
                    category: data.category,
                },
                { file }
            );
            return api.updateDocument(id, formData);
        },
        deleteFn: api.deleteDocument,
        successMessages: {
            create: 'Документ успешно создан',
            update: 'Документ успешно обновлён',
            delete: 'Документ успешно удалён',
        },
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await manager.handleSubmit(manager.formData);
            setFile(null);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        manager.resetForm();
        setFile(null);
    };

    if (manager.loading) return <div>Загрузка...</div>;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">Управление документами</h2>
                <button
                    onClick={() => manager.setShowForm(!manager.showForm)}
                    aria-label={manager.showForm ? 'Отменить создание документа' : 'Открыть форму создания документа'}
                    className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded hover:bg-blue-700 whitespace-nowrap"
                >
                    {manager.showForm ? 'Отмена' : '+ Добавить документ'}
                </button>
            </div>

            {manager.showForm && (
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6 overflow-x-hidden">
                    <h3 className="text-lg sm:text-xl font-semibold mb-4">
                        {manager.editingItem ? 'Редактировать документ' : 'Новый документ'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Название</label>
                            <input
                                type="text"
                                value={manager.formData.title}
                                onChange={(e) => manager.setField('title', e.target.value)}
                                required
                                className="w-full px-3 py-2 text-base border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Описание</label>
                            <textarea
                                value={manager.formData.description}
                                onChange={(e) => manager.setField('description', e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 text-base border rounded focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Категория</label>
                            <input
                                type="text"
                                list="categories-list"
                                value={manager.formData.category}
                                onChange={(e) => manager.setField('category', e.target.value)}
                                placeholder="Выберите или введите категорию"
                                className="w-full px-3 py-2 text-base border rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <datalist id="categories-list">
                                {DOCUMENT_CATEGORIES.map((category) => (
                                    <option key={category} value={category} />
                                ))}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Файл</label>
                            <input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                required={!manager.editingItem}
                                className="w-full px-3 py-2 text-base border rounded"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button
                                type="submit"
                                variant="primary"
                                loading={submitting}
                                className="w-full sm:w-auto"
                            >
                                {submitting ? 'Сохранение...' : 'Сохранить'}
                            </Button>
                            <Button
                                type="button"
                                onClick={resetForm}
                                variant="secondary"
                                disabled={submitting}
                                className="w-full sm:w-auto"
                            >
                                Отмена
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {manager.items.map((doc) => (
                    <div key={doc.id} className="bg-white p-4 sm:p-4 rounded-lg shadow flex flex-col sm:flex-row justify-between sm:items-start gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold break-words">{doc.title}</h3>
                            {doc.description && <p className="text-gray-600 text-sm mt-1 line-clamp-2">{doc.description}</p>}
                            {doc.category && (
                                <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                    {doc.category}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                                onClick={() => manager.handleEdit(doc)}
                                variant="warning"
                                className="px-3 py-1 text-xs sm:text-sm w-full sm:w-auto"
                            >
                                Изменить
                            </Button>
                            <Button
                                onClick={() => manager.handleDelete(doc.id)}
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
    description: '',
    category: '',
};
