import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';
import { api } from '../../../utils/api';
import { getErrorMessage } from '../../../utils/errorHandler';
import { useNotification } from '../../../contexts/NotificationContext';
import { MIN_USERNAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../../config/constants';

// Zod валидация
const loginSchema = z.object({
    username: z
        .string()
        .min(MIN_USERNAME_LENGTH, `Логин должен содержать минимум ${MIN_USERNAME_LENGTH} символов`)
        .max(50, 'Логин не должен превышать 50 символов')
        .trim(),
    password: z
        .string()
        .min(MIN_PASSWORD_LENGTH, `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символов`)
        .max(100, 'Пароль не должен превышать 100 символов'),
});

type LoginInput = z.infer<typeof loginSchema>;

/** Мета-данные для страницы входа */
export function meta() {
    return [{ title: 'Вход в админ-панель' }];
}

/** Страница входа в админ-панель */
export default function AdminLogin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({});
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrors({});
        
        // Валидация через Zod
        const result = loginSchema.safeParse({ username, password });
        
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors;
            const errorMap: Partial<Record<keyof LoginInput, string>> = {};
            
            if (fieldErrors.username?.[0]) {
                errorMap.username = fieldErrors.username[0];
            }
            if (fieldErrors.password?.[0]) {
                errorMap.password = fieldErrors.password[0];
            }
            
            setErrors(errorMap);
            return;
        }
        
        setLoading(true);

        try {
            const response = await api.login(result.data.username, result.data.password);
            
            // Проверяем роль пользователя
            if (response.user?.role !== 'admin') {
                setErrors({ username: 'Недостаточно прав доступа. Требуется роль администратора.' });
                showError('Только администраторы могут войти в админ-панель');
                return;
            }
            
            showSuccess('Вход выполнен успешно!');
            navigate('/admin');
        } catch (err) {
            const errorMessage = getErrorMessage(err);
            setErrors({ username: errorMessage });
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

                {(errors.username || errors.password) && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                        {errors.username || errors.password}
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
                            autoComplete="username"
                            disabled={loading}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                errors.username ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Введите логин"
                            aria-invalid={!!errors.username}
                            aria-describedby={errors.username ? 'username-error' : undefined}
                        />
                        {errors.username && (
                            <p id="username-error" className="mt-1 text-sm text-red-600">{errors.username}</p>
                        )}
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
                            autoComplete="current-password"
                            disabled={loading}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                errors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Введите пароль"
                            aria-invalid={!!errors.password}
                            aria-describedby={errors.password ? 'password-error' : undefined}
                        />
                        {errors.password && (
                            <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        aria-busy={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
            </div>
        </div>
    );
}
