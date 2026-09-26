#!/bin/bash

# Скрипт для отправки проекта на сервер
# Использование: ./deploy.sh

# ========== НАСТРОЙКИ ==========
SERVER_USER="root"              # Имя пользователя на сервере
SERVER_HOST="64.188.65.33"     # IP сервера
SERVER_PATH="/root/PRO100BOT"  # Путь на сервере
LOCAL_PATH="/Users/danya/Desktop/ PRO100BOT"  # Локальный путь

# ========== ПРОВЕРКА ==========
if [ ! -d "$LOCAL_PATH" ]; then
    echo "❌ Папка $LOCAL_PATH не найдена!"
    exit 1
fi

echo "🚀 Начинаю отправку проекта на сервер..."
echo "📁 Откуда: $LOCAL_PATH"
echo "📁 Куда: $SERVER_USER@$SERVER_HOST:$SERVER_PATH"
echo ""

# ========== ОТПРАВКА ==========
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'bot.sqlite' \
    --exclude 'bot.sqlite-journal' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude '.git' \
    --exclude 'deploy.sh' \
    "$LOCAL_PATH/" "$SERVER_USER@$SERVER_HOST:$SERVER_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Проект успешно отправлен!"
    echo ""
    echo "📝 Следующие шаги на сервере:"
    echo "   1. ssh $SERVER_USER@$SERVER_HOST"
    echo "   2. cd $SERVER_PATH"
    echo "   3. npm install"
    echo "   4. Создай .env файл с BOT_TOKEN и ADMIN_CHAT_ID"
    echo "   5. pm2 start index.js --name pro100bot"
else
    echo ""
    echo "❌ Ошибка при отправке!"
    exit 1
fi
