// Middleware для валидации входных данных
// Защита от XSS, SQL injection и других атак

const SANITIZE_PATTERNS = {
    script: /<script[^>]*>.*?<\/script>/gi,
    javascript: /javascript:/gi,
    onEvent: /on\w+\s*=/gi,
    sqlInjection: /(\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/gi,
};

const MAX_LENGTHS = {
    title: 255,
    description: 5000,
    name: 255,
    email: 255,
    username: 255,
    password: 255,
    url: 2048,
};

// Очистить строку от опасного кода
export function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    let sanitized = str;
    Object.values(SANITIZE_PATTERNS).forEach(pattern => {
        sanitized = sanitized.replace(pattern, '');
    });
    
    return sanitized.trim();
}

// Валидация и санитизация объекта данных
export function validateAndSanitize(data, schema) {
    const errors = [];
    const sanitized = {};
    
    Object.entries(schema).forEach(([field, rules]) => {
        let value = data[field];
        
        // Проверка обязательных полей
        if (rules.required && (!value || String(value).trim() === '')) {
            errors.push(`${field} обязательно`);
            return;
        }
        
        // Пропускаем пустые опциональные поля
        if (!value) {
            sanitized[field] = value;
            return;
        }
        
        // Сбор строки для проверки длины
        if (typeof value === 'string') {
            value = sanitizeString(value);
            
            // Проверка максимальной длины
            const maxLength = rules.maxLength || MAX_LENGTHS[field] || 5000;
            if (value.length > maxLength) {
                errors.push(`${field} не должен превышать ${maxLength} символов`);
                return;
            }
            
            // Проверка минимальной длины
            if (rules.minLength && value.length < rules.minLength) {
                errors.push(`${field} должен содержать минимум ${rules.minLength} символов`);
                return;
            }
        }
        
        // Валидация по типу
        if (rules.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                errors.push(`${field} должен быть корректным email`);
                return;
            }
        }
        
        if (rules.type === 'date') {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(value)) {
                errors.push(`${field} должен быть в формате YYYY-MM-DD`);
                return;
            }
        }
        
        // Кастомная валидация
        if (rules.validate && !rules.validate(value)) {
            errors.push(rules.validateMessage || `${field} некорректен`);
            return;
        }
        
        sanitized[field] = value;
    });
    
    return { sanitized, errors };
}

// Express middleware для валидации тела запроса
export function createValidationMiddleware(schema) {
    return (req, res, next) => {
        const { sanitized, errors } = validateAndSanitize(req.body, schema);
        
        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed',
                details: errors 
            });
        }
        
        // Заменяем body на очищенные данные
        req.body = sanitized;
        next();
    };
}
