#!/usr/bin/env bash
# СКРИПТ ДЛЯ БЫСТРОГО ЗАПУСКА ПРОЕКТА

echo "🚀 MRDK (Мариинский районный дом культуры)"
echo "=========================================="
echo ""

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
npm install

# 2. Установка зависимостей сервера
echo "📦 Установка зависимостей сервера..."
cd server
npm install
cd ..

# 3. Генерация JWT secret
if [ ! -f ".env" ]; then
    echo "🔐 Генерация JWT_SECRET..."
    SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    echo "JWT_SECRET=$SECRET" > .env
    echo "ADMIN_USERNAME=admin" >> .env
    echo "ADMIN_PASSWORD=admin123" >> .env
    echo "CORS_ORIGIN=http://localhost:5173" >> .env
    echo "✅ Создан .env файл"
fi

# 4. Запуск dev режима
echo ""
echo "🎯 Запуск в режиме разработки..."
echo "Frontend:  http://localhost:5173"
echo "Backend:   http://localhost:5000"
echo "Admin:     http://localhost:5173/admin/login"
echo ""

npm run dev
