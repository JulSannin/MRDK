import { useLoaderData } from 'react-router';
import { api } from '../../../utils/api';
import { handleDownload } from '../../../utils/fileHelpers';
import type { Document } from '../../entities/types';
import { createDataLoader } from '../../../utils/loaderFactory';

// Documents page metadata
export function meta() {
    return [{ title: 'Документы' }];
}

// Load documents
export const clientLoader = createDataLoader(api.getDocuments, 'documents');

// Documents page
export default function Documents() {
    const { documents } = useLoaderData<{ documents: Document[] }>();

    const groupedDocuments = documents.reduce(
        (acc, doc) => {
            const category = doc.category || 'Прочее';
            if (!acc[category]) acc[category] = [];
            acc[category].push(doc);
            return acc;
        },
        {} as Record<string, Document[]>
    );

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-8">Документы</h1>

            {Object.keys(groupedDocuments).length === 0 ? (
                <p className="text-gray-600">Документов пока нет</p>
            ) : (
                Object.entries(groupedDocuments).map(([category, docs]) => (
                    <div key={category} className="mb-8">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-600">{category}</h2>
                        <div className="space-y-3">
                            {docs.map((doc) => (
                                <div
                                    key={doc.id}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Скачать документ: ${doc.title}`}
                                    onClick={() => handleDownload(doc.fileUrl, doc.title)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleDownload(doc.fileUrl, doc.title);
                                        }
                                    }}
                                    className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <h3 className="font-semibold text-lg text-gray-800">{doc.title}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
