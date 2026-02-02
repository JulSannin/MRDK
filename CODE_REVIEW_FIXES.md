# Frontend Code Review - Примеры Исправлений

## 1. Исправление NotificationContext

### Текущий код (с проблемой):
```typescript
// app/contexts/NotificationContext.tsx
const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, message };
    
    setNotifications((prev) => {
        const updated = [...prev, notification];
        return updated.length > 2 ? updated.slice(-2) : updated;
    });

    // ❌ Проблема: таймаут не очищается при демонтировании компонента
    setTimeout(() => {
        removeNotification(id);
    }, 5000);
}, [removeNotification]);
```

### Исправленный код:
```typescript
// app/contexts/NotificationContext.tsx
export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutIdsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        
        // Очищаем таймаут из рефа
        const timeoutId = timeoutIdsRef.current.get(id);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutIdsRef.current.delete(id);
        }
    }, []);

    const showNotification = useCallback((type: NotificationType, message: string) => {
        const id = `${Date.now()}-${Math.random()}`;
        const notification: Notification = { id, type, message };
        
        setNotifications((prev) => {
            const updated = [...prev, notification];
            return updated.length > 2 ? updated.slice(-2) : updated;
        });

        // ✅ Таймаут сохраняется и может быть очищен
        const timeoutId = setTimeout(() => {
            removeNotification(id);
        }, 5000);
        
        timeoutIdsRef.current.set(id, timeoutId);
    }, [removeNotification]);

    // ✅ Очищаем все таймауты при демонтировании
    useEffect(() => {
        return () => {
            timeoutIdsRef.current.forEach(clearTimeout);
            timeoutIdsRef.current.clear();
        };
    }, []);

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
```

---

## 2. Улучшение API Client с Timeout

### Текущий код (с проблемой):
```typescript
async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
    retries = 3
): Promise<T> {
    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
        });
        return handleResponse<T>(response);
    } catch (error) {
        if (retries > 0 && (!options.method || options.method === 'GET')) {
            const delay = Math.pow(2, 3 - retries) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            return apiFetch<T>(url, options, retries - 1);
        }
        handleNetworkError(error);
    }
}
```

### Исправленный код:
```typescript
const API_TIMEOUT_MS = 30000; // 30 seconds

async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
    retries = 3
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            credentials: 'include',
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return handleResponse<T>(response);
    } catch (error) {
        clearTimeout(timeoutId);
        
        // Проверяем, был ли это timeout
        if (error instanceof DOMException && error.name === 'AbortError') {
            if (retries > 0 && (!options.method || options.method === 'GET')) {
                const delay = Math.pow(2, 3 - retries) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                return apiFetch<T>(url, options, retries - 1);
            }
            throw new ApiError('Request timeout', 408);
        }
        
        handleNetworkError(error);
    }
}
```

---

## 3. Разделение useManager Hook

### Текущий код (слишком большой):
```typescript
export function useManager<T extends { id: number }, F>(options: UseManagerOptions<T, F>) {
    // Слишком много логики в одном hook (264 строк)
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<F>(options.initialFormData);
    const [errors, setErrors] = useState<string[]>([]);
    
    // ... много другой логики
}
```

### Исправленный код (разбить на несколько hooks):

#### Hook 1: useFormState
```typescript
// app/hooks/useFormState.ts
export function useFormState<T extends Record<string, any>>(initialData: T) {
    const [formData, setFormData] = useState<T>(initialData);

    const resetForm = useCallback(() => {
        setFormData(initialData);
    }, [initialData]);

    const updateField = useCallback((field: keyof T, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const updateMultipleFields = useCallback((updates: Partial<T>) => {
        setFormData((prev) => ({
            ...prev,
            ...updates,
        }));
    }, []);

    return {
        formData,
        setFormData,
        resetForm,
        updateField,
        updateMultipleFields,
    };
}
```

#### Hook 2: useCRUDOperations
```typescript
// app/hooks/useCRUDOperations.ts
interface CRUDOperations<T> {
    loadFn: () => Promise<T[]>;
    createFn?: (data: any) => Promise<T>;
    updateFn?: (id: number, data: any) => Promise<T>;
    deleteFn?: (id: number) => Promise<void>;
}

export function useCRUDOperations<T extends { id: number }>({
    loadFn,
    createFn,
    updateFn,
    deleteFn,
}: CRUDOperations<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useNotification();
    const { confirm } = useConfirmDialog();

    // Загрузка
    useEffect(() => {
        setLoading(true);
        loadFn()
            .then(setItems)
            .catch((error) => {
                showError(getErrorMessage(error));
            })
            .finally(() => setLoading(false));
    }, [loadFn, showError]);

    // Создание
    const handleCreate = useCallback(
        async (data: any) => {
            if (!createFn) return;
            
            try {
                const newItem = await createFn(data);
                setItems((prev) => [...prev, newItem]);
                showSuccess('Элемент успешно создан');
                return newItem;
            } catch (error) {
                showError(getErrorMessage(error));
                throw error;
            }
        },
        [createFn, showSuccess, showError]
    );

    // Обновление
    const handleUpdate = useCallback(
        async (id: number, data: any) => {
            if (!updateFn) return;
            
            try {
                const updatedItem = await updateFn(id, data);
                setItems((prev) =>
                    prev.map((item) => (item.id === id ? updatedItem : item))
                );
                showSuccess('Элемент успешно обновлен');
                return updatedItem;
            } catch (error) {
                showError(getErrorMessage(error));
                throw error;
            }
        },
        [updateFn, showSuccess, showError]
    );

    // Удаление
    const handleDelete = useCallback(
        async (id: number) => {
            if (!deleteFn) return;
            
            const confirmed = await confirm({
                title: 'Удаление',
                message: 'Вы уверены, что хотите удалить этот элемент?',
                confirmText: 'Удалить',
                cancelText: 'Отмена',
                variant: 'danger',
            });

            if (!confirmed) return;

            try {
                await deleteFn(id);
                setItems((prev) => prev.filter((item) => item.id !== id));
                showSuccess('Элемент успешно удален');
            } catch (error) {
                showError(getErrorMessage(error));
            }
        },
        [deleteFn, showSuccess, showError, confirm]
    );

    return {
        items,
        loading,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
}
```

#### Hook 3: useFormValidation
```typescript
// app/hooks/useFormValidation.ts
export function useFormValidation<T extends Record<string, any>>(
    schema?: ValidationSchema
) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback(
        (data: T): boolean => {
            if (!schema) return true;

            const validationErrors: Record<string, string> = {};

            for (const [key, rules] of Object.entries(schema)) {
                const value = data[key];
                const stringValue = String(value ?? '').trim();

                if (rules.required && !stringValue) {
                    validationErrors[key] = `${key} обязательно`;
                    continue;
                }

                if (!stringValue) continue;

                if (rules.minLength && stringValue.length < rules.minLength) {
                    validationErrors[key] = `Минимум ${rules.minLength} символов`;
                }

                if (rules.maxLength && stringValue.length > rules.maxLength) {
                    validationErrors[key] = `Максимум ${rules.maxLength} символов`;
                }

                if (rules.type === 'email' && !isValidEmail(stringValue)) {
                    validationErrors[key] = 'Некорректный email';
                }
            }

            setErrors(validationErrors);
            return Object.keys(validationErrors).length === 0;
        },
        [schema]
    );

    return { errors, validate };
}
```

#### Пример использования в компоненте:
```typescript
export default function EventsManager() {
    const { formData, resetForm, updateField } = useFormState<EventFormData>({
        title: '',
        fullDescription: '',
        date: '',
    });

    const { errors, validate } = useFormValidation(
        {
            title: { required: true, minLength: 3, maxLength: 255 },
            fullDescription: { required: true, minLength: 20, maxLength: 5000 },
            date: { required: true, type: 'date' },
        }
    );

    const { items, loading, handleCreate } = useCRUDOperations({
        loadFn: api.getEvents,
        createFn: async (data) => {
            const shortDescription = buildShortDescription(data.fullDescription);
            return api.createEvent(buildFormData({ ...data, shortDescription }, {}));
        },
        updateFn: async (id, data) => {
            // ...
        },
        deleteFn: api.deleteEvent,
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!validate(formData)) {
            return;
        }

        try {
            await handleCreate(formData);
            resetForm();
        } catch {
            // Ошибка уже показана в handleCreate
        }
    };

    // ...
}
```

---

## 4. Добавление Input Validation с Zod

### Установка:
```bash
npm install zod
```

### Пример валидации для Login:
```typescript
// app/validators/auth.ts
import { z } from 'zod';

export const LoginSchema = z.object({
    username: z
        .string()
        .min(3, 'Логин должен содержать минимум 3 символа')
        .max(50, 'Логин не должен превышать 50 символов'),
    password: z
        .string()
        .min(5, 'Пароль должен содержать минимум 5 символов')
        .max(255, 'Пароль не должен превышать 255 символов'),
});

export type LoginFormData = z.infer<typeof LoginSchema>;
```

### Использование в компоненте:
```typescript
import { LoginSchema, type LoginFormData } from '../../../validators/auth';

export default function AdminLogin() {
    const [errors, setErrors] = useState<Partial<LoginFormData>>({});

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const validData = LoginSchema.parse({ username, password });
            // Логика входа с валидными данными
            const response = await api.login(validData.username, validData.password);
            // ...
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors: Partial<LoginFormData> = {};
                error.errors.forEach((err) => {
                    const field = err.path[0] as keyof LoginFormData;
                    fieldErrors[field] = err.message as any;
                });
                setErrors(fieldErrors);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={errors.username ? 'border-red-500' : ''}
                />
                {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
            </div>
            {/* ... */}
        </form>
    );
}
```

---

## 5. Добавление Retry Functionality

### Улучшение Events.tsx:
```typescript
// app/components/main/events/Events.tsx
export default function Events() {
    const [retryCount, setRetryCount] = useState(0);
    const { events, error } = useLoaderData<{ events: Event[], error?: string }>();
    
    const handleRetry = async () => {
        setRetryCount((prev) => prev + 1);
        // Перезагрузить данные
        try {
            const freshEvents = await api.getEvents();
            // Обновить состояние
        } catch (err) {
            showError('Не удалось загрузить события');
        }
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <div className="text-center">
                    <p className="text-red-500 font-semibold mb-2">
                        Ошибка загрузки
                    </p>
                    <p className="text-gray-600 mb-4">{error}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Повторить попытку
                        {retryCount > 0 && ` (${retryCount})`}
                    </button>
                    <a
                        href="/"
                        className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                    >
                        На главную
                    </a>
                </div>
            </div>
        );
    }

    // ... остальной код
}
```

---

## 6. Добавление Image Loading State

### Улучшение EventCard:
```typescript
// app/components/main/events/EventCard.tsx
export default function EventCard({ image, ...props }: EventCardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    return (
        <div className="rounded-lg overflow-hidden shadow-lg">
            <div className="relative aspect-video bg-gray-200">
                {!isLoaded && !isError && (
                    <div className="absolute inset-0 bg-gray-300 animate-pulse flex items-center justify-center">
                        <span className="text-gray-400">Загрузка...</span>
                    </div>
                )}
                
                {isError && (
                    <div className="absolute inset-0 bg-gray-400 flex items-center justify-center">
                        <span className="text-white">Ошибка загрузки</span>
                    </div>
                )}
                
                <img
                    src={image}
                    alt={props.title}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                />
            </div>
            {/* ... остальной контент карточки */}
        </div>
    );
}
```

---

## 7. Улучшение useWindowWidth

### Текущий код (проблема с hydration):
```typescript
export function useWindowWidth(defaultWidth = 1024) {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : defaultWidth
    );
    // ...
}
```

### Исправленный код:
```typescript
export function useWindowWidth(defaultWidth = 1024) {
    const [width, setWidth] = useState<number | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // Устанавливаем isMounted чтобы предотвратить hydration mismatch
        setIsMounted(true);
        setWidth(window.innerWidth);

        const handleResize = () => setWidth(window.innerWidth);
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Возвращаем defaultWidth пока компонент не смонтирован
    return isMounted ? (width ?? defaultWidth) : defaultWidth;
}
```

---

## 8. Улучшение Button Component

```typescript
// app/components/shared/ui/Button.tsx
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'warning' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: ReactNode;
    ariaLabel?: string;
}

const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    secondary: 'bg-gray-400 hover:bg-gray-500 text-white',
};

const sizeStyles = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className = '',
    children,
    ariaLabel,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading;

    return (
        <button
            disabled={isDisabled}
            aria-label={ariaLabel}
            aria-busy={loading}
            className={`
                rounded font-medium transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                ${variantStyles[variant]}
                ${sizeStyles[size]}
                ${className}
            `.trim()}
            {...props}
        >
            {loading ? (
                <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {children}
                </span>
            ) : (
                children
            )}
        </button>
    );
}
```

---

## 9. Добавление Tests Example

### Пример теста для Button:
```typescript
// app/components/shared/ui/__tests__/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button Component', () => {
    it('should render with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should handle click events', async () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);
        
        await userEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledOnce();
    });

    it('should be disabled when loading', () => {
        render(<Button loading>Submit</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have correct variant styles', () => {
        const { rerender } = render(<Button variant="danger">Delete</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-red-600');
        
        rerender(<Button variant="primary">Save</Button>);
        expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
    });
});
```

---

## 10. Добавление Tailwind Config для Colors

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2176FF',
        'primary-dark': '#1a5acc',
        dark: '#31393C',
        light: '#F5F5F5',
        'light-gray': '#D9D9D9',
      },
    },
  },
  // ...
};
```

Теперь использовать в коде:
```tsx
// Вместо: className="bg-[#2176FF]"
// Использовать: className="bg-primary"

<div className="bg-primary hover:bg-primary-dark text-white">
  // ...
</div>
```

---

Эти исправления помогут улучшить качество, производительность и надежность приложения!
