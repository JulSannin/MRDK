#!/usr/bin/env node

// Генератор безопасного JWT_SECRET
// Использование: node generate-secret.js

import crypto from 'crypto';

const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Сгенерирован JWT_SECRET:\n');
console.log(secret);
console.log('\n📝 Добавьте в .env файл:');
console.log(`JWT_SECRET=${secret}\n`);
console.log('⚠️  ВАЖНО: Никогда не коммитьте этот ключ в git!\n');
