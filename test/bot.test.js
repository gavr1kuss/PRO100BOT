'use strict';

/**
 * Прогон сценариев бота без Telegram.
 * Все запросы к Bot API перехватываются, записываются и получают фейковые ответы.
 * Запуск: npm test
 */

const { test, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pro100bot-test-'));
process.env.NODE_ENV = 'test';
process.env.DB_PATH = path.join(tmpDir, 'bot.sqlite');
process.env.BOT_TOKEN = '123456:TEST_TOKEN';
process.env.ADMIN_CHAT_ID = '999';

const { Telegram, TelegramError } = require('telegraf');
const { bot } = require('../index');
const { initDb, getUser, countReferrals } = require('../db');

const ADMIN = 999;

let calls = [];               // успешные запросы к Bot API
let failHook = null;          // (method, payload) => Error | undefined — чтобы сымитировать отказ Telegram
const subscribed = new Set(); // кто подписан на канал
let nextMessageId = 1;
let nextUpdateId = 1;

// Telegram отклоняет HTML-сообщения с неэкранированными <, > и &
function checkHtml(text) {
  const stripped = text.replace(/<\/?(b|i|u|s|code|pre)>/g, '');
  if (/[<>]/.test(stripped) || /&(?!(amp|lt|gt|quot|#\d+);)/.test(stripped)) {
    throw new TelegramError({ error_code: 400, description: "Bad Request: can't parse entities" });
  }
}

Telegram.prototype.callApi = async function callApi(method, payload = {}) {
  const err = failHook && failHook(method, payload);
  if (err) throw err;
  if (payload.parse_mode === 'HTML') checkHtml(payload.text ?? payload.caption ?? '');
  calls.push({ method, payload });
  switch (method) {
    case 'getMe':
      return { id: 1, is_bot: true, first_name: 'PRO100', username: 'Pro100giryabot' };
    case 'getChatMember':
      return { status: subscribed.has(payload.user_id) ? 'member' : 'left', user: { id: payload.user_id } };
    case 'sendMessage':
    case 'sendPhoto':
    case 'sendAnimation':
      return { message_id: nextMessageId++, date: 0, chat: { id: payload.chat_id, type: 'private' } };
    default:
      return true;
  }
};

function user(id, extra = {}) {
  return { id, is_bot: false, first_name: `User${id}`, ...extra };
}

async function send(from, text) {
  const message = { message_id: nextMessageId++, date: 0, chat: { id: from.id, type: 'private' }, from, text };
  if (text.startsWith('/')) {
    message.entities = [{ type: 'bot_command', offset: 0, length: text.split(' ')[0].length }];
  }
  await bot.handleUpdate({ update_id: nextUpdateId++, message });
}

async function press(from, data) {
  await bot.handleUpdate({
    update_id: nextUpdateId++,
    callback_query: {
      id: String(nextUpdateId),
      from,
      chat_instance: '1',
      data,
      message: { message_id: nextMessageId++, date: 0, chat: { id: from.id, type: 'private' }, text: '…' },
    },
  });
}

function sentTo(chatId) {
  return calls.filter(
    (c) => ['sendMessage', 'sendPhoto', 'sendAnimation'].includes(c.method) && String(c.payload.chat_id) === String(chatId)
  );
}

function lastTo(chatId) {
  const sent = sentTo(chatId);
  assert.ok(sent.length > 0, `бот ничего не отправил в чат ${chatId}`);
  return sent[sent.length - 1];
}

function textOf(call) {
  return call.payload.text ?? call.payload.caption ?? '';
}

function buttons(call) {
  const markup = call.payload.reply_markup || {};
  return (markup.keyboard || markup.inline_keyboard || []).flat().map((b) => (typeof b === 'string' ? b : b.text));
}

function adminTexts() {
  return sentTo(ADMIN).map(textOf);
}

async function passTrial(u, direction) {
  await send(u, '/start');
  await send(u, '➡️ Дальше');
  await send(u, direction);
  await send(u, '👶 Новичок');
  await press(u, 'injury_none');
  await press(u, 'injuries_done');
  await send(u, '❌ Ничего нет');
  await send(u, '2-3 раза');
  await press(u, 'goal_confidence');
  await press(u, 'goals_done');
}

async function applyForStarter(u, programDirection) {
  await send(u, '💪 Программы тренировок');
  await send(u, programDirection);
  await send(u, '📖 STARTER');
  await send(u, '✅ Записаться на пакет');
  await send(u, '📞 Оставить заявку');
}

before(async () => {
  await initDb();
});

beforeEach(() => {
  calls = [];
  failHook = null;
});

test('новый пользователь: /start запускает испытание, админ получает уведомление', async () => {
  const u = user(101, { first_name: 'Tom <3 & Jerry', username: 'tomjerry' });
  await send(u, '/start');

  assert.match(textOf(lastTo(u.id)), /ИСПЫТАНИЕ 0/);
  const admin = adminTexts();
  assert.equal(admin.length, 1, 'админ должен получить уведомление о новом пользователе');
  assert.match(admin[0], /Новый пользователь/);
  assert.match(admin[0], /Tom &lt;3 &amp; Jerry/);
});

test('испытание целиком: квиз, выбор травм и целей, результаты у админа', async () => {
  const u = user(102, { first_name: 'Анна' });
  await send(u, '/start');
  await send(u, '➡️ Дальше');
  assert.match(textOf(lastTo(u.id)), /ВЫБОР НАПРАВЛЕНИЯ/);
  await send(u, '👙 Фитнес');
  await send(u, '💪 Любитель');

  const injuries = lastTo(u.id);
  assert.match(textOf(injuries), /травмы/);
  assert.ok(buttons(injuries).includes('Никаких травм'), '«Никаких травм» не должно быть отмечено до выбора');

  await press(u, 'injury_knees');
  const edit = calls.filter((c) => c.method === 'editMessageReplyMarkup').pop();
  assert.ok(edit.payload.reply_markup.inline_keyboard.flat().some((b) => b.text === '✅ Колени'));
  await press(u, 'injuries_done');
  await send(u, '💎 Полный зал');
  await send(u, '4-5 раз');
  await press(u, 'goal_health');
  await press(u, 'goals_done');

  assert.match(textOf(lastTo(u.id)), /ПРОШЕЛ ВСЕ ИСПЫТАНИЯ/);
  assert.equal(getUser(u.id).stage, 'trial_final');
  const quiz = adminTexts().find((t) => t.includes('прошёл тест'));
  assert.ok(quiz, 'админ должен получить результаты квиза');
  assert.match(quiz, /Фитнес/);
  assert.match(quiz, /Колени/);
  assert.match(quiz, /Быть здоровым/);
});

test('заявка на пакет: у админа есть телефон и направление выбранной программы', async () => {
  const u = user(103, { first_name: 'Иван', username: 'ivan' });
  await passTrial(u, '👙 Фитнес');
  calls = [];
  await applyForStarter(u, '🏋️ Гипертрофия');

  assert.match(textOf(lastTo(u.id)), /Как тебя зовут/);
  assert.ok(adminTexts().some((t) => t.includes('Неполная заявка')), 'админ должен узнать о неполной заявке');

  await send(u, 'Иван Петров');
  await send(u, '+7 999 123-45-67');

  const report = adminTexts().find((t) => t.includes('НОВАЯ ЗАЯВКА'));
  assert.ok(report, 'админ должен получить заявку');
  assert.match(report, /\+7 999 123-45-67/, 'в заявке должен быть телефон');
  assert.match(report, /Иван Петров/);
  assert.match(report, /Направление: Гипертрофия/);
  assert.match(report, /Пакет: STARTER/);
  assert.equal(getUser(u.id).stage, 'menu');
});

test('заявка не теряется, если Telegram отклонил кнопку «Написать клиенту»', async () => {
  const u = user(104, { first_name: 'Без юзернейма' });
  await passTrial(u, '⚙️ Пауэрлифтинг');
  await applyForStarter(u, '⚙️ Пауэрлифтинг');
  await send(u, 'Пётр');

  failHook = (method, payload) => {
    if (method === 'sendMessage' && JSON.stringify(payload.reply_markup || {}).includes('tg://user')) {
      return new TelegramError({ error_code: 400, description: 'Bad Request: BUTTON_USER_PRIVACY_RESTRICTED' });
    }
    return undefined;
  };
  await send(u, '89001234567');

  const report = adminTexts().find((t) => t.includes('НОВАЯ ЗАЯВКА'));
  assert.ok(report, 'заявка должна дойти до админа без кнопки');
  assert.match(report, /89001234567/);
});

test('рефералка: статистика на экране, засчитываются только новые пользователи', async () => {
  const a = user(201);
  await send(a, '/start');
  await send(a, '🎯 Реферальная программа');

  const screen = textOf(lastTo(a.id));
  assert.match(screen, /Приглашено друзей: 0/);
  assert.match(screen, /Твой статус: Новобранец/);
  const code = getUser(a.id).ref_code;
  assert.ok(screen.includes(`https://t.me/Pro100giryabot?start=ref_${code}`));

  const b = user(202);
  await send(b, `/start ref_${code}`);
  assert.equal(countReferrals(a.id), 1, 'новый пользователь засчитывается');

  const c = user(203);
  await send(c, '/start');
  await send(c, `/start ref_${code}`);
  assert.equal(countReferrals(a.id), 1, 'старый пользователь не засчитывается');

  const other = user(204);
  await send(other, '/start');
  await send(b, `/start ref_${getUser(other.id).ref_code}`);
  assert.equal(countReferrals(a.id), 1, 'чужая ссылка не переписывает пригласившего');
  assert.equal(countReferrals(other.id), 0);
});

test('подарки: у разблокированной программы нет нерабочей кнопки записи', async () => {
  const a = user(301);
  await send(a, '/start');
  await send(user(302), `/start ref_${getUser(a.id).ref_code}`);
  subscribed.add(a.id);

  await send(a, '🎁 Твои подарки');
  assert.match(textOf(lastTo(a.id)), /ДОБРО ПОЖАЛОВАТЬ В КОМАНДУ/);

  await send(a, '📋 Программа тренировок');
  const unlocked = lastTo(a.id);
  assert.match(textOf(unlocked), /разблокирован/);
  assert.ok(!buttons(unlocked).some((b) => b.includes('Записаться')), 'кнопка «Записаться на пробную тренировку» тут не работает');

  await send(a, '🔙 Другие подарки');
  assert.match(textOf(lastTo(a.id)), /выбирай подарки/);
});

test('пробная тренировка: заявка на подарок уходит админу', async () => {
  const a = user(311, { username: 'gifted' });
  await send(a, '/start');
  await send(user(312), `/start ref_${getUser(a.id).ref_code}`);
  await send(user(313), `/start ref_${getUser(a.id).ref_code}`);
  subscribed.add(a.id);

  await send(a, '🎁 Твои подарки');
  await send(a, '💪 Пробная онлайн тренировка');
  assert.match(textOf(lastTo(a.id)), /ЗАРАБОТАЛ НАГРАДУ/);
  await send(a, '✅ Записаться на пробную тренировку');

  assert.match(textOf(lastTo(a.id)), /Заявка отправлена/);
  assert.ok(adminTexts().some((t) => t.includes('пробную онлайн тренировку') && t.includes('@gifted')));
});

test('гайд: без подписки его не получить, «Забрать подарок» можно нажать повторно', async () => {
  const u = user(401);
  await passTrial(u, '🔥 ССШ (Силачи старой школы)');

  await send(u, '🎁 Забрать подарок');
  assert.match(textOf(lastTo(u.id)), /подпишись на канал/i);

  calls = [];
  await send(u, '👨 Мужской гайд');
  assert.equal(calls.filter((c) => c.method === 'sendPhoto').length, 0, 'без подписки гайд не выдаётся');

  await send(u, '🎁 Забрать подарок');
  assert.match(textOf(lastTo(u.id)), /подпишись на канал/i, 'повторное нажатие снова проверяет подписку');

  subscribed.add(u.id);
  await press(u, 'check_subscription');
  assert.match(textOf(lastTo(u.id)), /ВЫБЕРИ ВЕРСИЮ ГАЙДА/);
  await send(u, '👨 Мужской гайд');
  assert.equal(lastTo(u.id).method, 'sendPhoto');
  await press(u, 'guide_next');
  assert.equal(getUser(u.id).guide_image_index, 1);
});

test('нажатие на старую кнопку квиза не оставляет «часики» на кнопке', async () => {
  const u = user(601);
  await passTrial(u, '⚙️ Пауэрлифтинг');
  calls = [];
  await press(u, 'injury_spine');
  assert.ok(calls.some((c) => c.method === 'answerCallbackQuery'));
});

test('ошибка при обработке сообщения не роняет бота', async () => {
  const u = user(701);
  await send(u, '/start');
  failHook = (method, payload) => (String(payload.chat_id) === String(u.id) ? new Error('network down') : undefined);
  await assert.doesNotReject(() => send(u, '➡️ Дальше'));
});

test('база сохраняется на диск целиком', async () => {
  const data = fs.readFileSync(process.env.DB_PATH);
  assert.equal(data.subarray(0, 15).toString(), 'SQLite format 3');
  assert.deepEqual(fs.readdirSync(tmpDir), ['bot.sqlite'], 'рядом с базой не остаётся временных файлов');
});
