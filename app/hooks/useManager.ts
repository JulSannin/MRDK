import { useState, useEffect, useCallback } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';
import { getErrorMessage } from '../utils/errorHandler';
import {
    TITLE_MIN_LENGTH,
    TITLE_MAX_LENGTH,
    DESCRIPTION_MAX_LENGTH,
    EMAIL_MAX_LENGTH,
    NAME_MAX_LENGTH,
} from '../config/constants';
import type { DeleteResponse } from '../components/entities/types';

type ValidationRule = {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    type?: 'date' | 'email' | 'number';
    min?: number;
    max?: number;
};

type ValidationSchema = Record<string, ValidationRule>;

/**
 * Выполняет базовую валидацию данных формы
 * @param {Record<string, any>} data - Данные формы для валидации
 * @param {ValidationSchema} schema - Схема валидации (опционально)
 * @returns {string[]} Массив сообщений об ошибках
 */
function validateFormData(data: Record<string, unknown>, schema?: ValidationSchema): string[] {
    const errors: string[] = [];

    if (schema) {
        for (const [key, rules] of Object.entries(schema)) {
            const value = data[key];
            const stringValue = String(value ?? '').trim();

            if (rules.required && !stringValue) {
                errors.push(`${key} обязательно`);
                continue;
            }

            if (!stringValue) continue;

            if (rules.minLength !== undefined && stringValue.length < rules.minLength) {
                errors.push(`${key} должен содержать минимум ${rules.minLength} символа`);
            }
            if (rules.maxLength !== undefined && stringValue.length > rules.maxLength) {
                errors.push(`${key} не должен превышать ${rules.maxLength} символов`);
            }

            if (rules.type === 'date') {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(stringValue)) {
                    errors.push(`Дата должна быть в формате YYYY-MM-DD`);
                }
            }

            if (rules.type === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(stringValue)) {
                    errors.push(`Некорректный формат email`);
                }
            }

            if (rules.type === 'number') {
                const numberValue = Number(value);
                if (Number.isNaN(numberValue)) {
                    errors.push(`${key} должен быть числом`);
                } else {
                    if (rules.min !== undefined && numberValue < rules.min) {
                        errors.push(`${key} должен быть не меньше ${rules.min}`);
                    }
                    if (rules.max !== undefined && numberValue > rules.max) {
                        errors.push(`${key} должен быть не больше ${rules.max}`);
                    }
                }
            }
        }

        return errors;
    }
    
    for (const [key, value] of Object.entries(data)) {
        const stringValue = String(value || '').trim();
        
        if (!stringValue) continue;
        
        if (key.includes('title') || key.includes('name')) {
            const minLength = TITLE_MIN_LENGTH;
            const maxLength = key.includes('name') ? NAME_MAX_LENGTH : TITLE_MAX_LENGTH;
            if (stringValue.length < minLength) {
                errors.push(`${key} должен содержать минимум ${minLength} символа`);
            }
            if (stringValue.length > maxLength) {
                errors.push(`${key} не должен превышать ${maxLength} символов`);
            }
            if (/<|>|script|javascript:|on\w+=/i.test(stringValue)) {
                errors.push(`${key} содержит недопустимые символы`);
            }
        }
        
        if (key.includes('description')) {
            if (stringValue.length > DESCRIPTION_MAX_LENGTH) {
                errors.push(`Описание не должно превышать ${DESCRIPTION_MAX_LENGTH} символов`);
            }
            if (/<script|javascript:|on\w+=/i.test(stringValue)) {
                errors.push(`Описание содержит недопустимый код`);
            }
        }
        
        if (key.includes('date') && stringValue) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(stringValue)) {
                errors.push(`Дата должна быть в формате YYYY-MM-DD`);
            }
        }
        
        if (key.includes('email') && stringValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(stringValue)) {
                errors.push(`Некорректный формат email`);
            }
            if (stringValue.length > EMAIL_MAX_LENGTH) {
                errors.push(`Email не должен превышать ${EMAIL_MAX_LENGTH} символов`);
            }
        }
    }
    
    return errors;
}

/**
 * Универсальный хук для CRUD операций в админ-панели
 * @template T - Тип элемента с обязательным полем id
 * @template F - Тип данных формы
 * @param {Object} config - Конфигурация хука
 * @returns {Object} Объект с состояниями и методами управления
 */
export function useManager<T extends { id: number }, F extends Record<string, unknown>, D = F>({
    initialFormData,
    loadFn,
    createFn,
    updateFn,
    deleteFn,
    validationSchema,
    successMessages,
}: {
    initialFormData: F;
    loadFn: (signal?: AbortSignal) => Promise<T[]>;
    createFn: (data: D) => Promise<T>;
    updateFn: (id: number, data: D) => Promise<T>;
    deleteFn: (id: number) => Promise<DeleteResponse>;
    validationSchema?: ValidationSchema;
    successMessages: {
        create: string;
        update: string;
        delete: string;
    };
}) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<F>(initialFormData);
    
    const { showSuccess, showError } = useNotification();
    const { confirm } = useConfirmDialog();

    const loadItems = useCallback(async (signal?: AbortSignal) => {
        try {
            const data = await loadFn(signal);
            setItems(data);
        } catch (err) {
            if (!(err instanceof DOMException && err.name === 'AbortError')) {
                showError(getErrorMessage(err));
            }
        } finally {
            setLoading(false);
        }
    }, [loadFn, showError]);

    useEffect(() => {
        const controller = new AbortController();
        loadItems(controller.signal);
        return () => controller.abort();
    }, [loadItems]);

    const handleSubmit = useCallback(async (data: D) => {
        const validationTarget = data instanceof FormData ? formData : (data as F);
        const validationErrors = validateFormData(validationTarget, validationSchema);
        if (validationErrors.length > 0) {
            validationErrors.forEach(err => showError(err));
            return;
        }
        
        try {
            if (editingItem) {
                await updateFn(editingItem.id, data);
                showSuccess(successMessages.update);
            } else {
                await createFn(data);
                showSuccess(successMessages.create);
            }
            await loadItems();
            resetForm();
        } catch (err) {
            showError(getErrorMessage(err));
        }
    }, [editingItem, formData, validationSchema, createFn, updateFn, loadItems, showSuccess, showError, successMessages]);

    const handleEdit = useCallback((item: T) => {
        setEditingItem(item);
        setFormData({ ...initialFormData, ...item } as F);
        setShowForm(true);
    }, [initialFormData]);

    const handleDelete = useCallback(async (id: number, confirmOptions?: {
        title: string;
        message: string;
    }) => {
        if (confirmOptions) {
            const confirmed = await confirm({
                title: confirmOptions.title,
                message: confirmOptions.message,
                confirmText: 'Удалить',
                cancelText: 'Отмена',
                variant: 'danger',
            });
            if (!confirmed) return;
        }

        try {
            await deleteFn(id);
            showSuccess(successMessages.delete);
            await loadItems();
        } catch (err) {
            showError(getErrorMessage(err));
        }
    }, [confirm, deleteFn, loadItems, showSuccess, showError, successMessages]);

    const resetForm = useCallback(() => {
        setFormData(initialFormData);
        setEditingItem(null);
        setShowForm(false);
    }, [initialFormData]);

    const setField = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
        setFormData((prev) => ({ ...prev, [key]: value }));
    }, []);

    return {
        items,
        loading,
        showForm,
        editingItem,
        formData,
        
        setFormData,
        setField,
        setShowForm,
        setEditingItem,
        
        loadItems,
        handleSubmit,
        handleEdit,
        handleDelete,
        resetForm,
    };
}
