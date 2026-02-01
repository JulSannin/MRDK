import { useNotification } from '../../../../contexts/NotificationContext';

interface NotificationProps {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
}

/** Отдельный элемент уведомления */
export default function NotificationItem({ id, type, message }: NotificationProps) {
    const { removeNotification } = useNotification();

    const styles = {
        success: 'bg-green-50 border-green-500 text-green-800',
        error: 'bg-red-50 border-red-500 text-red-800',
        info: 'bg-blue-50 border-blue-500 text-blue-800',
        warning: 'bg-yellow-50 border-yellow-500 text-yellow-800',
    };

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠',
    };

    return (
        <div
            className={`flex items-center justify-between p-4 mb-3 rounded-lg border-l-4 shadow-lg ${styles[type]} animate-slide-in`}
            role="alert"
        >
            <div className="flex items-center gap-3">
                <span className="text-xl font-bold">{icons[type]}</span>
                <p className="font-medium">{message}</p>
            </div>
            <button
                onClick={() => removeNotification(id)}
                className="text-gray-500 hover:text-gray-700 ml-4"
                aria-label="Закрыть"
            >
                ✕
            </button>
        </div>
    );
}
