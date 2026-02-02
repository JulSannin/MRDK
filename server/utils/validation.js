// Check if date is valid
export const isValidDate = (value) => {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
};

// Allowed reminder priority values
export const ALLOWED_PRIORITIES = new Set(['high', 'medium', 'low']);
