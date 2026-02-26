# 🚀 Инструкция по отправке проекта на сервер

## Способ 1: SCP (Secure Copy) - самый простой

### Базовая команда:
```bash
scp -r /Users/danya/Desktop/\ PRO100BOT user@server:/path/to/destination/
```

### С исключением ненужных файлов:
```bash
cd "/Users/danya/Desktop/ PRO100BOT"
rsync -avz --exclude 'node_modules' \
           --exclude '.env' \
           --exclude 'bot.sqlite' \
           --exclude 'bot.sqlite-journal' \
           --exclude '*.log' \
           --exclude '.DS_Store' \
           --exclude '.git' \
           ./ user@server:/path/to/destination/
```

### Пример с конкретными данными:
```bash
# Замени на свои данные:
# user - имя пользователя на сервере
# server - IP адрес или домен сервера
# /home/user/bot - путь на сервере

scp -r "/Users/danya/Desktop/ PRO100BOT" user@192.168.1.100:/home/user/bot
```

---

## Способ 2: rsync (рекомендуется) - быстрее и умнее

### Базовая команда:
```bash
rsync -avz --exclude 'node_modules' \
           --exclude '.env' \
           --exclude 'bot.sqlite*' \
           --exclude '*.log' \
           "/Users/danya/Desktop/ PRO100BOT/" user@server:/path/to/destination/
```

### С прогрессом и удалением лишних файлов:
```bash
rsync -avz --progress --delete \
           --exclude 'node_modules' \
           --exclude '.env' \
           --exclude 'bot.sqlite*' \
           --exclude '*.log' \
           --exclude '.DS_Store' \
           "/Users/danya/Desktop/ PRO100BOT/" user@server:/path/to/destination/
```

**Параметры:**
- `-a` - архивный режим (сохраняет права, даты)
- `-v` - подробный вывод
- `-z` - сжатие при передаче
- `--progress` - показывать прогресс
- `--delete` - удалять на сервере файлы, которых нет локально

---

## Способ 3: SFTP (через FileZilla или командную строку)

### Через FileZilla:
1. Скачай [FileZilla](https://filezilla-project.org/)
2. Подключись к серверу (Host, Username, Password, Port 22)
3. Перетащи папку проекта

### Через командную строку:
```bash
sftp user@server
# После подключения:
put -r "/Users/danya/Desktop/ PRO100BOT" /path/on/server/
```

---

## Способ 4: Git (если есть репозиторий)

### На сервере:
```bash
git clone https://github.com/yourusername/pro100bot.git
cd pro100bot
npm install
# Создай .env файл
nano .env
```

### Обновление на сервере:
```bash
git pull
npm install  # если были новые зависимости
```

---

## Способ 5: Через архив (tar + scp)

### Создать архив:
```bash
cd "/Users/danya/Desktop/ PRO100BOT"
tar -czf bot.tar.gz \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='bot.sqlite*' \
  --exclude='*.log' \
  .
```

### Отправить архив:
```bash
scp bot.tar.gz user@server:/path/to/destination/
```

### На сервере распаковать:
```bash
cd /path/to/destination/
tar -xzf bot.tar.gz
npm install
```

---

## ⚙️ После отправки на сервер

### 1. Подключись к серверу:
```bash
ssh user@server
```

### 2. Перейди в папку проекта:
```bash
cd /path/to/destination/PRO100BOT
```

### 3. Установи зависимости:
```bash
npm install
```

### 4. Создай файл .env:
```bash
nano .env
# Вставь:
# BOT_TOKEN=твой_токен
# ADMIN_CHAT_ID=твой_id
```

### 5. Запусти бота (для теста):
```bash
node index.js
```

### 6. Для постоянной работы используй PM2:
```bash
# Установи PM2
npm install -g pm2

# Запусти бота
pm2 start index.js --name pro100bot

# Автозапуск при перезагрузке сервера
pm2 startup
pm2 save

# Просмотр логов
pm2 logs pro100bot
```

---

## 🔐 Настройка SSH ключей (чтобы не вводить пароль)

### На локальной машине:
```bash
ssh-keygen -t rsa -b 4096
ssh-copy-id user@server
```

Теперь можно подключаться без пароля!

---

## 📝 Пример полного деплоя одной командой

Создай файл `deploy.sh` (см. ниже) и запусти:
```bash
chmod +x deploy.sh
./deploy.sh
```
