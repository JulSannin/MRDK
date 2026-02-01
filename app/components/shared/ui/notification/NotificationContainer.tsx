import { useNotification } from '../../../../contexts/NotificationContext';
import NotificationItem from './NotificationItem';

/** Контейнер для отображения списка уведомлений */
export default function NotificationContainer() {
    const { notifications } = useNotification();

    if (notifications.length === 0) return null;

    return (
        <div 
            className="fixed top-4 right-4 z-[100] w-full max-w-md"
            aria-live="polite"
            aria-atomic="true"
        >
            {notifications.map((notification) => (
                <NotificationItem
                    key={notification.id}
                    id={notification.id}
                    type={notification.type}
                    message={notification.message}
                />
            ))}
        </div>
    );
}
