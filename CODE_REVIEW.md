# Code Review - Frontend часть МРДК

## 📋 Обзор проекта
- **Технологии**: React 19.2.3, React Router 7.10.1, TypeScript 5.9.2, Tailwind CSS 4.1.13, Vite 7.1.7
- **Архитектура**: Структура разделена на компоненты (shared, main, features), утилиты, хуки, контексты
- **Статус**: Production-ready с некоторыми рекомендациями к улучшению

---

## ✅ Сильные стороны

### 1. **Правильная архитектура проекта**
- ✅ Хорошая структура папок (components, utils, hooks, contexts, routes)
- ✅ Разделение на shared, main, features компоненты
- ✅ Использование React Router 7 с современным подходом
- ✅ Правильное использование TypeScript для type safety

### 2. **Контексты и провайдеры**
- ✅ `NotificationContext` - хорошо реализован с автоматическим удалением
- ✅ `ConfirmDialogContext` - использует Promises, имеет поддержку focus management
- ✅ Правильное использование `useCallback` для оптимизации

### 3. **Обработка ошибок**
- ✅ Централизованная обработка ошибок (`errorHandler.ts`)
- ✅ Кастомный класс `ApiError`
- ✅ Хорошие сообщения об ошибках на русском

### 4. **Доступность**
- ✅ `aria-label` на кнопках и интерактивных элементах
- ✅ `aria-current="page"` для пагинации
- ✅ `aria-live="polite"` для уведомлений
- ✅ Focus management в confirm dialog

### 5. **API клиент**
- ✅ CSRF token protection
- ✅ Exponential backoff для retry логики
- ✅ Centralized response handling
- ✅ TypeScript типы для всех endpoints

### 6. **Оптимизация перформанса**
- ✅ `useCallback` используется правильно
- ✅ `useMemo` для вычисления количества элементов на странице
- ✅ Lazy loading через React Router clientLoader

---

## ⚠️ Проблемы и рекомендации

### 1. **API Клиент - Потенциальная утечка памяти**

**Файл**: [app/utils/api.ts](app/utils/api.ts#L100-L120)

**Проблема**: В функции `getCSRFToken()` может быть утечка памяти при многочисленных вызовах

```typescript
// ❌ Потенциальная проблема - нет очистки при долгих запросах
async function getCSRFToken(): Promise<string> {
    try {
        // ...
```

**Рекомендация**: Добавить timeout и кэшинг токена с версионированием

```typescript
async function getCSRFToken(): Promise<string> {
    const now = Date.now();
    
    // Проверяем кэш
    if (cachedCSRFToken && (now - csrfTokenFetchedAt) < CSRF_TOKEN_TTL_MS) {
        return cachedCSRFToken;
    }
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
        
        const response = await fetch(`${API_URL}/csrf-token`, {
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new ApiError('Failed to get CSRF token');
        
        const data = await response.json();
        cachedCSRFToken = data.token;
        csrfTokenFetchedAt = now;
        return cachedCSRFToken;
    } catch (error) {
        clearCSRFTokenCache();
        throw new ApiError('Failed to fetch CSRF token');
    }
}
```

---

### 2. **useManager Hook - Сложность и Производительность**

**Файл**: [app/hooks/useManager.ts](app/hooks/useManager.ts)

**Проблемы**:
- Hook слишком большой и делает слишком много
- Нет кэширования элементов между вызовами
- Нет дебаунсинга при быстрых изменениях

**Рекомендация**: Разбить на несколько smaller hooks

```typescript
// Создать отдельный hook для управления формой
export function useFormState<T extends Record<string, any>>(initialData: T) {
    const [formData, setFormData] = useState(initialData);
    
    const resetForm = useCallback(() => {
        setFormData(initialData);
    }, [initialData]);
    
    const updateField = useCallback((field: keyof T, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);
    
    return { formData, setFormData, resetForm, updateField };
}

// Создать отдельный hook для CRUD операций
export function useCRUD<T extends { id: number }>(
    loadFn: () => Promise<T[]>,
    createFn?: (data: Omit<T, 'id'>) => Promise<T>,
    updateFn?: (id: number, data: Partial<T>) => Promise<T>,
    deleteFn?: (id: number) => Promise<void>
) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        setLoading(true);
        loadFn()
            .then(setItems)
            .finally(() => setLoading(false));
    }, [loadFn]);
    
    // ...rest of the logic
    
    return { items, loading, /* ...methods */ };
}
```

---

### 3. **NotificationContext - Утечка памяти при множественных уведомлениях**

**Файл**: [app/contexts/NotificationContext.tsx](app/contexts/NotificationContext.tsx#L40-L50)

**Проблема**: Таймаут не очищается, если компонент размонтируется

```typescript
// ❌ Таймаут может вызвать ошибку, если компонент удален
setTimeout(() => {
    removeNotification(id);
}, 5000);
```

**Рекомендация**:

```typescript
const showNotification = useCallback((type: NotificationType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    const notification: Notification = { id, type, message };
    
    setNotifications((prev) => {
        const updated = [...prev, notification];
        return updated.length > 2 ? updated.slice(-2) : updated;
    });

    const timeoutId = setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
    
    return () => clearTimeout(timeoutId); // Возвращаем cleanup function
}, []);
```

---

### 4. **Отсутствие Global Error Boundary**

**Файл**: [app/root.tsx](app/root.tsx#L80-L100)

**Проблема**: Error Boundary в root.tsx не логирует ошибки на сервис

**Рекомендация**: Добавить интеграцию с сервисом логирования (Sentry)

```typescript
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    useEffect(() => {
        // Логирование в Sentry или другой сервис
        if (error instanceof Error) {
            // Sentry.captureException(error);
        }
    }, [error]);
    
    // ...rest of code
}
```

---

### 5. **Events.tsx - Проблемы с пагинацией**

**Файл**: [app/components/main/events/Events.tsx](app/components/main/events/Events.tsx#L40-L50)

**Проблема**: При изменении количества элементов на странице текущая страница может выйти за границы

```typescript
// ❌ Может быть лучше
useEffect(() => {
    const newTotalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
    if (currentPage > newTotalPages) {
        setCurrentPage(1);
    }
}, [events.length, eventsPerPage, currentPage]);
```

**Рекомендация**: Использовать useTransition для более плавного перехода

```typescript
import { useTransition } from 'react';

export default function Events() {
    const [isPending, startTransition] = useTransition();
    
    const goToPage = (page: number) => {
        startTransition(() => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    };
}
```

---

### 6. **Отсутствие Input Validation на Frontend**

**Файл**: [app/components/features/auth/AdminLogin.tsx](app/components/features/auth/AdminLogin.tsx)

**Проблема**: Базовая валидация, но нет проверки на XSS

**Рекомендация**: Использовать библиотеку для валидации (Zod, Yup)

```typescript
import { z } from 'zod';

const LoginSchema = z.object({
    username: z.string().min(3).max(50),
    password: z.string().min(5).max(255),
});

const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
        const result = LoginSchema.parse({ username, password });
        // Дальше логика входа
    } catch (err) {
        if (err instanceof z.ZodError) {
            setError(err.errors[0].message);
        }
    }
};
```

---

### 7. **Отсутствие Loading State для Images**

**Файл**: [app/components/main/events/EventCard.tsx](app/components/main/events/EventCard.tsx)

**Проблема**: Изображения загружаются без placeholder

**Рекомендация**: Добавить skeleton loader или blur placeholder

```typescript
export default function EventCard({ image, ...props }: EventCardProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    
    return (
        <div className="relative aspect-video bg-gray-200 rounded overflow-hidden">
            {!isLoaded && <div className="absolute inset-0 bg-gray-300 animate-pulse" />}
            {isError && <div className="absolute inset-0 bg-gray-400 flex items-center justify-center">Ошибка загрузки</div>}
            <img
                src={image}
                onLoad={() => setIsLoaded(true)}
                onError={() => setIsError(true)}
                className={`w-full h-full object-cover transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
        </div>
    );
}
```

---

### 8. **Performance - Отсутствие Virtual Scrolling**

**Файл**: [app/components/features/auth/EventsManager.tsx](app/components/features/auth/EventsManager.tsx#L180)

**Проблема**: Если событий много, список будет медленным

**Рекомендация**: Использовать виртуализацию для больших списков

```typescript
import { FixedSizeList as List } from 'react-window';

// Для больших списков
{sortEventsByDate(manager.items).length > 50 && (
    <List
        height={600}
        itemCount={sortEventsByDate(manager.items).length}
        itemSize={80}
        width="100%"
    >
        {Row}
    </List>
)}
```

---

### 9. **useWindowWidth - SSR проблема**

**Файл**: [app/hooks/useWindowWidth.ts](app/hooks/useWindowWidth.ts)

**Проблема**: Может вызвать hydration mismatch

**Рекомендация**: Улучшить инициализацию

```typescript
export function useWindowWidth(defaultWidth = 1024) {
    const [width, setWidth] = useState<number | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setWidth(window.innerWidth);
        
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return mounted ? width || defaultWidth : defaultWidth;
}
```

---

### 10. **Отсутствие Retry UI для Failed Loads**

**Файл**: [app/routes/events.tsx](app/routes/events.tsx)

**Проблема**: Если загрузка событий не удалась, нет способа повторить попытку

```typescript
// ❌ Текущая реализация
export async function clientLoader() {
    try {
        const events = await api.getEvents();
        return { events };
    } catch (error) {
        return { events: [] }; // Молчаливый сбой
    }
}
```

**Рекомендация**: Добавить обработку ошибок в компонент

```typescript
export default function Events() {
    const { events, error } = useLoaderData<{ events: Event[], error?: string }>();
    const [retryCount, setRetryCount] = useState(0);
    
    const handleRetry = async () => {
        setRetryCount(prev => prev + 1);
        // Повторить загрузку
    };
    
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <p className="text-red-500 mb-4">{error}</p>
                <button onClick={handleRetry} className="px-4 py-2 bg-blue-600 text-white rounded">
                    Повторить попытку
                </button>
            </div>
        );
    }
    
    // ...
}
```

---

### 11. **Button Component - Отсутствие Accessibility**

**Файл**: [app/components/shared/ui/Button.tsx](app/components/shared/ui/Button.tsx)

**Рекомендация**: Улучшить a11y поддержку

```typescript
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'danger' | 'warning' | 'secondary';
    loading?: boolean;
    children: ReactNode;
    ariaLabel?: string;
    ariaPressed?: boolean;
}

export default function Button({
    variant = 'primary',
    loading = false,
    disabled,
    className = '',
    children,
    ariaLabel,
    ariaPressed,
    ...props
}: ButtonProps) {
    return (
        <button
            disabled={disabled || loading}
            aria-label={ariaLabel}
            aria-pressed={ariaPressed}
            aria-busy={loading}
            className={`...`}
            {...props}
        >
            {/* ... */}
        </button>
    );
}
```

---

### 12. **EventsManager - Проблема с FormData и Images**

**Файл**: [app/components/features/auth/EventsManager.tsx](app/components/features/auth/EventsManager.tsx#L30)

**Проблема**: Если image файл не выбран, он все равно отправляется как null

**Рекомендация**: 

```typescript
const createFn = async (data: EventFormData) => {
    const shortDescription = buildShortDescription(data.fullDescription);
    const formData = buildFormData(
        {
            title: data.title,
            shortDescription,
            fullDescription: data.fullDescription,
            date: data.date,
        },
        imageFile ? { image: imageFile } : {} // Отправляем только если есть файл
    );
    return api.createEvent(formData);
};
```

---

### 13. **Отсутствие Debounce для Live Search**

Если будут добавлены фильтры/поиск, используйте debounce:

```typescript
import { useEffect, useState, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

    useEffect(() => {
        timeoutRef.current = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => clearTimeout(timeoutRef.current);
    }, [value, delay]);

    return debouncedValue;
}
```

---

### 14. **Tailwind CSS - Смешивание inline styles и классов**

**Файл**: [app/components/main/events/Events.tsx](app/components/main/events/Events.tsx#L85-L90)

**Проблема**: Смешивание inline flex gap с Tailwind классами

```tsx
// ❌ Лучше использовать только классы
<div className="flex flex-wrap justify-start md:justify-center xl:justify-start max-w-[300px] md:max-w-[830px] xl:max-w-[1260px] gap-[30px]">

// ✅ Использовать переменные Tailwind
<div className="flex flex-wrap justify-start md:justify-center xl:justify-start gap-8 max-w-xs md:max-w-2xl xl:max-w-4xl">
```

---

### 15. **package.json - Отсутствует version script для типов**

**Файл**: [package.json](package.json)

**Рекомендация**: Добавить скрипт для проверки типов перед commit

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "eslint . --ext .ts,.tsx",
    "pre-commit": "npm run type-check && npm run lint"
  }
}
```

---

## 🔒 Security Issues

### 1. **CSRF Protection - хорошо реализовано**
✅ CSRF token кэшируется и обновляется
✅ Token отправляется с каждым методом, требующим его

### 2. **XSS Prevention**
⚠️ Используется JSX, который автоматически escape HTML
⚠️ Но нет валидации user-generated content на сервере

### 3. **Sensitive Data в state**
✅ No passwords stored in state
✅ Auth token хранится в cookies с `credentials: 'include'`

---

## 🎨 CSS/Design Issues

### 1. **Inconsistent Spacing**
- Использование как `gap-[30px]`, так и `gap-8` (смешивание подходов)
- Рекомендация: Использовать только Tailwind scale (gap-4, gap-6, gap-8)

### 2. **Color Palette**
- Используются hardcoded цвета типа `#2176FF` и `#31393C`
- Рекомендация: Добавить в tailwind.config.js:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#2176FF',
        dark: '#31393C',
        light: '#F5F5F5',
      }
    }
  }
}
```

Тогда использовать: `className="bg-primary"` вместо `className="bg-[#2176FF]"`

---

## 📱 Responsive Design

✅ **Хорошее**: Используется mobile-first подход с `md:` и `xl:` breakpoints
✅ **Хорошее**: `useWindowWidth` hook для адаптивных расчетов
⚠️ **Улучшить**: Тестировать на реальных мобильных устройствах (не только браузер)

---

## 🧪 Testing

❌ **Отсутствуют unit тесты**
❌ **Отсутствуют e2e тесты**

**Рекомендация**: Добавить тестирование

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

Пример теста для Button компонента:

```typescript
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
    it('should render with loading state', () => {
        render(<Button loading>Loading</Button>);
        expect(screen.getByRole('button')).toHaveAttribute('disabled');
    });
});
```

---

## 📊 Performance Metrics

### Current State:
- ✅ React 19 - современная версия
- ✅ Vite - быстрая сборка
- ✅ TypeScript strict mode
- ⚠️ Нет code splitting между routes (React Router v7 может это сделать)

### Recommendations:

```typescript
// react-router.config.ts - добавить route-based code splitting
import { defineRouteConfig } from '@react-router/dev/route-config';

export default [
    {
        index: 'routes/home.tsx',
        lazy: () => import('./routes/home'),
    },
    // ... остальные routes
] satisfies RouteConfig;
```

---

## ✨ Best Practices Applied

✅ Правильное использование React Hooks
✅ Правильное использование TypeScript
✅ Правильная обработка ошибок
✅ Хорошая структура проекта
✅ Правильное использование контекстов
✅ Правильная работа с async операциями
✅ Accessibility поддержка где нужна

---

## 📝 Recommendations Priority

### 🔴 High Priority
1. Добавить валидацию с Zod/Yup
2. Исправить утечку памяти в NotificationContext
3. Добавить timeout для API запросов
4. Добавить тесты (unit + e2e)

### 🟡 Medium Priority
1. Разбить useManager hook на меньшие части
2. Добавить virtual scrolling для больших списков
3. Добавить retry логику для failed loads
4. Использовать tailwind.config.js для цветов

### 🟢 Low Priority
1. Добавить Sentry для error tracking
2. Оптимизировать изображения с skeleton loaders
3. Добавить debounce для search (если будет добавлен)
4. Улучшить performance с useTransition

---

## 🚀 Deployment Notes

Приложение готово для развертывания на Railway:

```bash
# Build
npm run build

# Production server запустится на порту по умолчанию
npm start
```

Убедитесь, что environment переменные установлены:
- `VITE_API_URL` - URL API сервера

---

## 📚 Дополнительные ресурсы

- [React Router 7 Docs](https://reactrouter.com/docs/en/v7/start/overview)
- [React 19 Docs](https://react.dev)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Web Accessibility](https://www.w3.org/WAI/fundamentals/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**Дата ревью**: 2 февраля 2026
**Статус**: ✅ Production-ready с рекомендациями
