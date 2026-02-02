// Get error message from different error types
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message || 'Неизвестная ошибка';
    }
    return String(error) || 'Неизвестная ошибка';
}

// Validate and parse ID parameter
export function validateId(id) {
    const parsed = Number.parseInt(String(id), 10);

    if (Number.isNaN(parsed)) {
        return {
            valid: false,
            error: 'ID должен быть числом',
        };
    }

    if (parsed < 0) {
        return {
            valid: false,
            error: 'ID не должен быть отрицательным',
        };
    }

    return {
        valid: true,
        id: parsed,
    };
}
