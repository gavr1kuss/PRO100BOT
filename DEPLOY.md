# 🚀 Деплой на сервер

Бот работает на VPS под [pm2](https://pm2.keymetrics.io/) из папки `/root/PRO100BOT`.
Код туда можно доставлять двумя способами.

## Способ 1 (рекомендую): git pull на сервере

Работает из любой системы, в том числе из PowerShell в Windows: `ssh` там уже есть.

### Один раз: подключить папку на сервере к этому репозиторию

```bash
ssh root@IP_СЕРВЕРА
cd /root/PRO100BOT
git status
```

`git status` покажет правки, сделанные прямо на сервере. Их нет на GitHub, поэтому сначала перенеси их в репозиторий. Исключение — `bot.pid`: при запуске через pm2 этот файл не нужен, верни его командой `git checkout -- bot.pid`.

```bash
git remote set-url origin https://github.com/gavr1kuss/PRO100BOT.git
git pull --ff-only origin main
npm install
pm2 restart pro100bot
```

Если `git status` ответил, что это не git-репозиторий, поставь код рядом и перенеси настройки и базу:

```bash
pm2 stop pro100bot
cd /root
git clone https://github.com/gavr1kuss/PRO100BOT.git PRO100BOT-new
cp PRO100BOT/.env PRO100BOT/bot.sqlite PRO100BOT-new/
mv PRO100BOT PRO100BOT-old && mv PRO100BOT-new PRO100BOT
cd PRO100BOT && npm install && pm2 restart pro100bot
```

### Дальше: каждый деплой одной командой со своего компьютера

```bash
ssh root@IP_СЕРВЕРА "cd /root/PRO100BOT && git pull --ff-only && npm install && pm2 restart pro100bot"
```

Если репозиторий станет приватным, серверу для `git pull` нужен доступ: создай на сервере ключ (`ssh-keygen`), добавь публичную часть на GitHub в Settings → Deploy keys и переключи адрес на `git@github.com:gavr1kuss/PRO100BOT.git`.

## Способ 2: rsync (macOS, Linux, WSL)

```bash
cp deploy.env.example deploy.env   # один раз: впиши DEPLOY_HOST и DEPLOY_PATH
./deploy.sh
```

Скрипт копирует код без `node_modules`, `.env` и базы, а потом подсказывает команды для сервера.

## Первый запуск на новом сервере

```bash
# нужен Node.js 18+
cd /root/PRO100BOT
./server-setup.sh                   # npm install, .env из шаблона, pm2
nano .env                           # BOT_TOKEN и ADMIN_CHAT_ID
pm2 start index.js --name pro100bot
pm2 startup && pm2 save             # автозапуск после перезагрузки сервера
```

## Полезные команды pm2

```bash
pm2 status                 # запущен ли бот
pm2 logs pro100bot         # логи (выйти: Ctrl+C)
pm2 restart pro100bot      # перезапуск после обновления
```

## Резервная копия базы

Все пользователи, заявки и рефералы лежат в `/root/PRO100BOT/bot.sqlite`. Скачать копию к себе:

```bash
scp root@IP_СЕРВЕРА:/root/PRO100BOT/bot.sqlite ./bot-backup.sqlite
```
