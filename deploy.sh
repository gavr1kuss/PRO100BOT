#!/bin/bash

# Скрипт для отправки проекта на сервер через rsync (macOS, Linux, WSL)
# Использование: ./deploy.sh
#
# Сервер и путь берутся из deploy.env (он в .gitignore):
#   cp deploy.env.example deploy.env
# или из переменных окружения DEPLOY_HOST и DEPLOY_PATH.

# ========== НАСТРОЙКИ ==========
cd "$(dirname "$0")" || exit 1   # отправляем папку, в которой лежит скрипт

if [ -f deploy.env ]; then
    source deploy.env
fi

if [ -z "$DEPLOY_HOST" ]; then
    echo "❌ Не указан сервер."
    echo "   Создай deploy.env: cp deploy.env.example deploy.env"
    echo "   и впиши DEPLOY_HOST, например root@1.2.3.4"
    exit 1
fi
DEPLOY_PATH="${DEPLOY_PATH:-/root/PRO100BOT}"

echo "🚀 Начинаю отправку проекта на сервер..."
echo "📁 Откуда: $(pwd)"
echo "📁 Куда: $DEPLOY_HOST:$DEPLOY_PATH"
echo ""

# ========== ОТПРАВКА ==========
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'deploy.env' \
    --exclude 'bot.sqlite*' \
    --exclude 'bot.pid' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude '.git' \
    ./ "$DEPLOY_HOST:$DEPLOY_PATH/"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Проект успешно отправлен!"
    echo ""
    echo "📝 Следующие шаги на сервере:"
    echo "   1. ssh $DEPLOY_HOST"
    echo "   2. cd $DEPLOY_PATH"
    echo "   3. npm install"
    echo "   4. pm2 restart pro100bot"
    echo "      (первый запуск: ./server-setup.sh, заполни .env, pm2 start index.js --name pro100bot)"
else
    echo ""
    echo "❌ Ошибка при отправке!"
    exit 1
fi
