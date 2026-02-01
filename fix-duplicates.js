import fs from 'fs';

const dbPath = 'server/database/db.json';

// Читаем базу
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Переиндексируем события
db.events = db.events.map((event, index) => ({
  ...event,
  id: index
}));

// Обновляем meta
db._meta.lastEventId = db.events.length - 1;

// Сохраняем
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('✅ Дубль удален!');
console.log('✅ Переиндексировано событий:', db.events.length);
console.log('✅ Последний ID:', db._meta.lastEventId);
