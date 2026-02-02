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

// Default database structure
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

// Load database from file
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

// Save database to file with race condition protection
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

// Initialize database and create default admin user
export async function initDatabase() {
    let db = await loadDb();

    // Create default admin if no users exist
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

// Database helper functions
export const db = {
    // Events
    async getAllEvents() {
        const data = await loadDb();
        return data.events;
    },

    async getEvent(id) {
        const data = await loadDb();
        return data.events.find((e) => e.id === id);
    },

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

    async deleteEvent(id) {
        const data = await loadDb();
        data.events = data.events.filter((e) => e.id !== id);
        await saveDb(data);
        return true;
    },

    // Documents
    async getAllDocuments() {
        const data = await loadDb();
        return data.documents;
    },

    async getDocument(id) {
        const data = await loadDb();
        return data.documents.find((d) => d.id === id);
    },

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

    async deleteDocument(id) {
        const data = await loadDb();
        data.documents = data.documents.filter((d) => d.id !== id);
        await saveDb(data);
        return true;
    },

    // Reminders
    async getAllReminders() {
        const data = await loadDb();
        return data.reminders;
    },

    async getReminder(id) {
        const data = await loadDb();
        return data.reminders.find((r) => r.id === id);
    },

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

    async deleteReminder(id) {
        const data = await loadDb();
        data.reminders = data.reminders.filter((r) => r.id !== id);
        await saveDb(data);
        return true;
    },

    // Workplan
    async getAllWorkplan() {
        const data = await loadDb();
        return data.workplan;
    },

    async getWorkplanItem(id) {
        const data = await loadDb();
        return data.workplan.find((w) => w.id === id);
    },

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

    async deleteWorkplanItem(id) {
        const data = await loadDb();
        data.workplan = data.workplan.filter((w) => w.id !== id);
        await saveDb(data);
        return true;
    },

    // Users
    async getUserByUsername(username) {
        const data = await loadDb();
        return data.users.find((u) => u.username === username);
    },

    async getUserById(id) {
        const data = await loadDb();
        return data.users.find((u) => u.id === id);
    },

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

