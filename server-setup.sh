#!/bin/bash

# Скрипт для настройки проекта на сервере
# Запусти этот скрипт НА СЕРВЕРЕ после отправки файлов

echo "🔧 Настройка проекта на сервере..."

# Проверка Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    echo "Установи Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ npm: $(npm --version)"

# Установка зависимостей
echo ""
echo "📦 Устанавливаю зависимости..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при установке зависимостей!"
    exit 1
fi

# Проверка .env файла
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  Файл .env не найден!"
    echo "Создаю .env из шаблона .env.example..."
    cp .env.example .env
    echo "✅ Файл .env создан. Заполни его!"
    echo "   nano .env"
else
    echo "✅ Файл .env найден"
fi

# Установка PM2 (если не установлен)
if ! command -v pm2 &> /dev/null; then
    echo ""
    echo "📦 Устанавливаю PM2..."
    npm install -g pm2
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📝 Следующие шаги:"
echo "   1. Отредактируй .env файл: nano .env"
echo "   2. Запусти бота: pm2 start index.js --name pro100bot"
echo "   3. Автозапуск: pm2 startup && pm2 save"
echo "   4. Логи: pm2 logs pro100bot"
