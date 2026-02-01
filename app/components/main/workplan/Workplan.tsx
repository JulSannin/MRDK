import { useLoaderData } from 'react-router';
import { api } from '../../../utils/api';
import { handleDownload } from '../../../utils/fileHelpers';
import type { WorkplanItem } from '../../entities/types';
import { createDataLoader } from '../../../utils/loaderFactory';

/** Мета-данные для страницы плана работы */
export function meta() {
    return [{ title: 'План работы' }];
}

/** Загрузка плана работы */
export const clientLoader = createDataLoader(api.getWorkplan, 'workplan');

/** Страница с планом работы */
export default function Workplan() {
    const { workplan } = useLoaderData<{ workplan: WorkplanItem[] }>();

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">План работы</h1>

            {workplan.length === 0 ? (
                <p className="text-gray-600">Плана работы пока нет</p>
            ) : (
                <div className="space-y-4">
                    {workplan.map((item) => (
                        <div 
                            key={item.id} 
                            role={item.fileUrl ? "button" : undefined}
                            tabIndex={item.fileUrl ? 0 : undefined}
                            aria-label={item.fileUrl ? `Скачать план работы за ${item.month} ${item.year}` : undefined}
                            onClick={item.fileUrl ? () => handleDownload(item.fileUrl!, `План работы ${item.month} ${item.year}`) : undefined}
                            onKeyDown={item.fileUrl ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleDownload(item.fileUrl!, `План работы ${item.month} ${item.year}`);
                                }
                            } : undefined}
                            className={`bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow ${
                                item.fileUrl ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-lg font-semibold">{item.month} {item.year}</h3>
                            </div>
                            <p className="text-gray-700">{item.description}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
