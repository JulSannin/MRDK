import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../../utils/api';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useNotification } from '../../../contexts/NotificationContext';
import { MIN_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../../config/constants';

/** Мета-данные для страницы входа */
export function meta() {
    return [{ title: 'Вход в админ-панель' }];
}

/** Страница входа в админ-панель */
export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        
        // Базовая валидация
        if (username.length < MIN_USERNAME_LENGTH) {
            setError(`Логин должен содержать минимум ${MIN_USERNAME_LENGTH} символа`);
            return;
        }
        
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(`Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`);
            return;
        }
        
        setLoading(true);

        try {
            const response = await api.login(username, password);
            
            // Проверяем роль пользователя
            if (response.user?.role !== 'admin') {
                setError('Недостаточно прав доступа. Требуется роль администратора.');
                showError('Только администраторы могут войти в админ-панель');
                return;
            }
            
            showSuccess('Вход выполнен успешно!');
            navigate('/admin');
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setError(errorMessage);
            showError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    Админ-панель
                </h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                            Логин
                        </label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            maxLength={50}
                            autoComplete="username"
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Введите логин"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={5}
                            autoComplete="current-password"
                            disabled={loading}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            placeholder="Введите пароль"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
}
