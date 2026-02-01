import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../../utils/api';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useNotification } from '../../../contexts/NotificationContext';
import EventsManager from './EventsManager';
import DocumentsManager from './DocumentsManager';
import RemindersManager from './RemindersManager';
import WorkplanManager from './WorkplanManager';

/** Мета-данные для страницы админ-панели */
export function meta() {
    return [{ title: 'Админ-панель' }];
}

type Tab = 'events' | 'documents' | 'reminders' | 'workplan';

/** Страница админ-панели */
export default function Admin() {
    const [activeTab, setActiveTab] = useState<Tab>('events');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { showError, showInfo } = useNotification();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const result = await api.verifyToken();
                if (result.valid && result.user?.role === 'admin') {
                    setIsAuthenticated(true);
                } else {
                    if (result.valid && result.user?.role !== 'admin') {
                        showError('Недостаточно прав доступа. Требуется роль администратора.');
                    }
                    navigate('/admin/login');
                }
            } catch (err) {
                const errorMessage = getErrorMessage(err);
                showError(errorMessage);
                navigate('/admin/login');
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [navigate, showError]);

    const handleLogout = () => {
        api.logout().catch(() => null);
        showInfo('Вы вышли из системы');
        navigate('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    const tabs = [
        { id: 'events' as Tab, label: 'События', ariaLabel: 'Управление событиями' },
        { id: 'documents' as Tab, label: 'Документы', ariaLabel: 'Управление документами' },
        { id: 'reminders' as Tab, label: 'Памятки', ariaLabel: 'Управление памятками' },
        { id: 'workplan' as Tab, label: 'План работы', ariaLabel: 'Управление планом работы' },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Админ-панель МРДК</h1>
                    <button
                        onClick={handleLogout}
                        className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded hover:bg-red-700 transition-colors whitespace-nowrap"
                    >
                        Выйти
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex overflow-x-auto space-x-4 sm:space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 mb-6 sm:mb-8">
                {activeTab === 'events' && <EventsManager />}
                {activeTab === 'documents' && <DocumentsManager />}
                {activeTab === 'reminders' && <RemindersManager />}
                {activeTab === 'workplan' && <WorkplanManager />}
            </div>
        </div>
    );
}
