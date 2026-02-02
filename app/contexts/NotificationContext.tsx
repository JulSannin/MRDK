import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
}

export interface NotificationContextType {
    notifications: Notification[];
    showNotification: (type: NotificationType, message: string) => void;
    removeNotification: (id: string) => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    showWarning: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * Провайдер контекста уведомлений
 * @param {Object} props - Пропсы компонента
 * @param {ReactNode} props.children - Дочерние элементы
 * @returns {JSX.Element} Провайдер с системой уведомлений
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        // Очищаем таймаут при удалении
        const timeout = timeoutsRef.current.get(id);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(id);
        }
    }, []);

    // Очищаем все таймауты при демонтировании компонента
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
            timeoutsRef.current.clear();
        };
    }, []);

    const showNotification = useCallback((type: NotificationType, message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        const notification: Notification = { id, type, message };
        
        setNotifications((prev) => {
            const updated = [...prev, notification];
            return updated.length > 2 ? updated.slice(-2) : updated;
        });

        // Сохраняем таймаут в рефе для последующей очистки
        const timeout = setTimeout(() => {
            removeNotification(id);
        }, 5000);
        timeoutsRef.current.set(id, timeout);
    }, [removeNotification]);

    const showSuccess = useCallback((message: string) => {
        showNotification('success', message);
    }, [showNotification]);

    const showError = useCallback((message: string) => {
        showNotification('error', message);
    }, [showNotification]);

    const showInfo = useCallback((message: string) => {
        showNotification('info', message);
    }, [showNotification]);

    const showWarning = useCallback((message: string) => {
        showNotification('warning', message);
    }, [showNotification]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                showNotification,
                removeNotification,
                showSuccess,
                showError,
                showInfo,
                showWarning,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

/**
 * Хук для использования системы уведомлений
 * @returns {NotificationContextType} Объект с методами для показа уведомлений
 */
export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
}
