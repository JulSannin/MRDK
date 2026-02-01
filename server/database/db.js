import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import bcrypt from 'bcryptjs';
import { BCRYPT_ROUNDS } from '../config.js';
import { getLogger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'db.json');

let writeQueue = Promise.resolve();

/** Структура базы данных по умолчанию */
const defaultDb = {
    events: [],
    documents: [],
    reminders: [],
    workplan: [],
    users: [],
    _meta: {
        lastEventId: 0,
        lastDocumentId: 0,
        lastReminderId: 0,
        lastWorkplanId: 0,
        lastUserId: 0,
    },
};

/**
 * Загружает базу данных из файла
 * @returns {Promise<Object>} Объект с данными БД
 */
export async function loadDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        const logger = getLogger();
        logger.warn('Failed to load database, using default structure', {
            error: error?.message || String(error),
        });
        return { ...defaultDb };
    }
}

/**
 * Сохраняет базу данных в файл с защитой от race condition
 * @param {Object} db - Объект с данными БД для сохранения
 * @returns {Promise<void>}
 */
export async function saveDb(db) {
    writeQueue = writeQueue.then(async () => {
        try {
            const tmpPath = `${dbPath}.tmp`;
            await fs.writeFile(tmpPath, JSON.stringify(db, null, 2));
            await fs.rename(tmpPath, dbPath);
        } catch (error) {
            const logger = getLogger();
            logger.error('❌ Failed to save database:', error);
            throw error;
        }
    });
    return writeQueue;
}

/**
 * Инициализирует базу данных и создает пользователя-администратора по умолчанию
 * @returns {Promise<void>}
 */
export async function initDatabase() {
    let db = await loadDb();

    // Создаем админа по умолчанию если нет пользователей
    if (db.users.length === 0) {
        const defaultUsername = process.env.ADMIN_USERNAME || 'admin';
        const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(defaultPassword, BCRYPT_ROUNDS);
        db.users.push({
            id: ++db._meta.lastUserId,
            username: defaultUsername,
            password: hashedPassword,
            role: 'admin',
            createdAt: new Date().toISOString(),
        });
        await saveDb(db);
    }
}

/** Вспомогательные функции для работы с базой данных */
export const db = {
    /**
     * Получает все события
     * @returns {Promise<Array>} Массив событий
     */
    async getAllEvents() {
        const data = await loadDb();
        return data.events;
    },

    /**
     * Получает событие по ID
     * @param {number} id - ID события
     * @returns {Promise<Object|undefined>} Объект события или undefined
     */
    async getEvent(id) {
        const data = await loadDb();
        return data.events.find((e) => e.id === id);
    },

    /**
     * Создает новое событие
     * @param {Object} event - Данные события
     * @returns {Promise<Object>} Созданное событие с ID
     */
    async createEvent(event) {
        const data = await loadDb();
        const newEvent = {
            id: ++data._meta.lastEventId,
            ...event,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        data.events.push(newEvent);
        await saveDb(data);
        return newEvent;
    },

    /**
     * Обновляет событие по ID
     * @param {number} id - ID события
     * @param {Object} updates - Поля для обновления
     * @returns {Promise<Object|null>} Обновленное событие или null
     */
    async updateEvent(id, updates) {
        const data = await loadDb();
        const index = data.events.findIndex((e) => e.id === id);
        if (index === -1) return null;
        data.events[index] = {
            ...data.events[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await saveDb(data);
        return data.events[index];
    },

    /**
     * Удаляет событие по ID
     * @param {number} id - ID события
     * @returns {Promise<boolean>} true при успешном удалении
     */
    async deleteEvent(id) {
        const data = await loadDb();
        data.events = data.events.filter((e) => e.id !== id);
        await saveDb(data);
        return true;
    },

    /**
     * Получает все документы
     * @returns {Promise<Array>} Массив документов
     */
    async getAllDocuments() {
        const data = await loadDb();
        return data.documents;
    },

    /**
     * Получает документ по ID
     * @param {number} id - ID документа
     * @returns {Promise<Object|undefined>} Объект документа или undefined
     */
    async getDocument(id) {
        const data = await loadDb();
        return data.documents.find((d) => d.id === id);
    },

    /**
     * Создает новый документ
     * @param {Object} doc - Данные документа
     * @returns {Promise<Object>} Созданный документ с ID
     */
    async createDocument(doc) {
        const data = await loadDb();
        const newDoc = {
            id: ++data._meta.lastDocumentId,
            ...doc,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        data.documents.push(newDoc);
        await saveDb(data);
        return newDoc;
    },

    /**
     * Обновляет документ по ID
     * @param {number} id - ID документа
     * @param {Object} updates - Поля для обновления
     * @returns {Promise<Object|null>} Обновленный документ или null
     */
    async updateDocument(id, updates) {
        const data = await loadDb();
        const index = data.documents.findIndex((d) => d.id === id);
        if (index === -1) return null;
        data.documents[index] = {
            ...data.documents[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await saveDb(data);
        return data.documents[index];
    },

    /**
     * Удаляет документ по ID
     * @param {number} id - ID документа
     * @returns {Promise<boolean>} true при успешном удалении
     */
    async deleteDocument(id) {
        const data = await loadDb();
        data.documents = data.documents.filter((d) => d.id !== id);
        await saveDb(data);
        return true;
    },

    /**
     * Получает все памятки
     * @returns {Promise<Array>} Массив памяток
     */
    async getAllReminders() {
        const data = await loadDb();
        return data.reminders;
    },

    /**
     * Получает памятку по ID
     * @param {number} id - ID памятки
     * @returns {Promise<Object|undefined>} Объект памятки или undefined
     */
    async getReminder(id) {
        const data = await loadDb();
        return data.reminders.find((r) => r.id === id);
    },

    /**
     * Создает новую памятку
     * @param {Object} reminder - Данные памятки
     * @returns {Promise<Object>} Созданная памятка с ID
     */
    async createReminder(reminder) {
        const data = await loadDb();
        const newReminder = {
            id: ++data._meta.lastReminderId,
            ...reminder,
            completed: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        data.reminders.push(newReminder);
        await saveDb(data);
        return newReminder;
    },

    /**
     * Обновляет памятку по ID
     * @param {number} id - ID памятки
     * @param {Object} updates - Поля для обновления
     * @returns {Promise<Object|null>} Обновленная памятка или null
     */
    async updateReminder(id, updates) {
        const data = await loadDb();
        const index = data.reminders.findIndex((r) => r.id === id);
        if (index === -1) return null;
        data.reminders[index] = {
            ...data.reminders[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await saveDb(data);
        return data.reminders[index];
    },

    /**
     * Удаляет памятку по ID
     * @param {number} id - ID памятки
     * @returns {Promise<boolean>} true при успешном удалении
     */
    async deleteReminder(id) {
        const data = await loadDb();
        data.reminders = data.reminders.filter((r) => r.id !== id);
        await saveDb(data);
        return true;
    },

    /**
     * Получает весь план работы
     * @returns {Promise<Array>} Массив элементов плана работы
     */
    async getAllWorkplan() {
        const data = await loadDb();
        return data.workplan;
    },

    /**
     * Получает элемент плана работы по ID
     * @param {number} id - ID элемента
     * @returns {Promise<Object|undefined>} Объект элемента или undefined
     */
    async getWorkplanItem(id) {
        const data = await loadDb();
        return data.workplan.find((w) => w.id === id);
    },

    /**
     * Создает новый элемент плана работы
     * @param {Object} item - Данные элемента
     * @returns {Promise<Object>} Созданный элемент с ID
     */
    async createWorkplanItem(item) {
        const data = await loadDb();
        const newItem = {
            id: ++data._meta.lastWorkplanId,
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        data.workplan.push(newItem);
        await saveDb(data);
        return newItem;
    },

    /**
     * Обновляет элемент плана работы по ID
     * @param {number} id - ID элемента
     * @param {Object} updates - Поля для обновления
     * @returns {Promise<Object|null>} Обновленный элемент или null
     */
    async updateWorkplanItem(id, updates) {
        const data = await loadDb();
        const index = data.workplan.findIndex((w) => w.id === id);
        if (index === -1) return null;
        data.workplan[index] = {
            ...data.workplan[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };
        await saveDb(data);
        return data.workplan[index];
    },

    /**
     * Удаляет элемент плана работы по ID
     * @param {number} id - ID элемента
     * @returns {Promise<boolean>} true при успешном удалении
     */
    async deleteWorkplanItem(id) {
        const data = await loadDb();
        data.workplan = data.workplan.filter((w) => w.id !== id);
        await saveDb(data);
        return true;
    },

    /**
     * Получает пользователя по имени
     * @param {string} username - Имя пользователя
     * @returns {Promise<Object|undefined>} Объект пользователя или undefined
     */
    async getUserByUsername(username) {
        const data = await loadDb();
        return data.users.find((u) => u.username === username);
    },

    /**
     * Получает пользователя по ID
     * @param {number} id - ID пользователя
     * @returns {Promise<Object|undefined>} Объект пользователя или undefined
     */
    async getUserById(id) {
        const data = await loadDb();
        return data.users.find((u) => u.id === id);
    },

    /**
     * Создает нового пользователя
     * @param {Object} user - Данные пользователя
     * @returns {Promise<Object>} Созданный пользователь с ID
     */
    async createUser(user) {
        const data = await loadDb();
        const newUser = {
            id: ++data._meta.lastUserId,
            ...user,
            createdAt: new Date().toISOString(),
        };
        data.users.push(newUser);
        await saveDb(data);
        return newUser;
    },
};

