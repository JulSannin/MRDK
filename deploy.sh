#!/bin/bash

# Deployment скрипт для MRDK
# Использование: ./deploy.sh

set -e

echo "🚀 Starting MRDK deployment..."

# 1. Pull latest code
echo "📥 Pulling latest code from git..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install --production

echo "📦 Installing frontend dependencies..."
cd ..
npm install

# 3. Build frontend
echo "🔨 Building frontend..."
npm run build

# 4. Run database migrations (if needed)
# echo "🗄️  Running database migrations..."
# cd server
# npm run migrate

# 5. Restart services
echo "🔄 Restarting backend with PM2..."
pm2 restart mrdk-api || pm2 start ecosystem.config.json

# 6. Health check
echo "🏥 Checking health..."
sleep 3
curl -f http://localhost:5000/api/health || echo "⚠️  Health check failed"

echo "✅ Deployment completed!"
echo "📊 Check status: pm2 status"
echo "📜 View logs: pm2 logs mrdk-api"
