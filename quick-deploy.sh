#!/bin/bash

# Быстрая отправка на сервер одной командой
# Использование: ./quick-deploy.sh

cd "/Users/danya/Desktop/ PRO100BOT"

echo "🚀 Отправляю проект на сервер root@64.188.65.33..."
echo ""

rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.env' \
    --exclude 'bot.sqlite' \
    --exclude 'bot.sqlite-journal' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    --exclude '.git' \
    ./ root@64.188.65.33:/root/PRO100BOT/

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Проект успешно отправлен!"
    echo ""
    echo "📝 Теперь подключись к серверу:"
    echo "   ssh root@64.188.65.33"
    echo ""
    echo "📝 И выполни на сервере:"
    echo "   cd /root/PRO100BOT"
    echo "   chmod +x server-setup.sh"
    echo "   ./server-setup.sh"
    echo "   nano .env  # заполни BOT_TOKEN и ADMIN_CHAT_ID"
    echo "   pm2 start index.js --name pro100bot"
else
    echo ""
    echo "❌ Ошибка при отправке!"
    exit 1
fi
