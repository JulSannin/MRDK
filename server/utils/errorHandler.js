/**
 * Get error message from different error types
 * @param {Error | string} error - Error object or string
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message || 'Неизвестная ошибка';
    }
    return String(error) || 'Неизвестная ошибка';
}

/**
 * Validate and parse ID parameter
 * @param {string | number} id - ID to validate
 * @returns {{valid: boolean, id?: number, error?: string}} Validation result
 */
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
