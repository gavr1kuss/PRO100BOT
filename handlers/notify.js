/**
 * Модуль уведомлений админу (@papochka86)
 * Отправляет уведомления о ключевых событиях в боте.
 */

const config = require('../config');

/**
 * Экранирование для parse_mode: 'HTML'.
 * Без него Telegram отклоняет сообщение, если в имени пользователя есть <, > или &.
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Отправить уведомление админу
 */
async function notifyAdmin(bot, text) {
  const adminId = config.ADMIN_CHAT_ID;
  if (!adminId || adminId === '0' || adminId === '') return;
  try {
    await bot.telegram.sendMessage(adminId, text, { parse_mode: 'HTML' });
  } catch (e) {
    console.error('❌ Ошибка уведомления админу:', e.message);
  }
}

/**
 * 🆕 Новый пользователь
 */
async function notifyNewUser(bot, ctx) {
  const user = ctx.from;
  if (!user) return;
  const name = escapeHtml([user.first_name, user.last_name].filter(Boolean).join(' '));
  const username = user.username ? `@${user.username}` : '—';
  const text = [
    '🆕 <b>Новый пользователь!</b>',
    '',
    `👤 Имя: ${name}`,
    `📎 Username: ${username}`,
    `🆔 ID: <code>${user.id}</code>`,
    `📅 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
  await notifyAdmin(bot, text);
}

/**
 * ✅ Пользователь прошёл начальный тест (квиз)
 */
async function notifyQuizCompleted(bot, ctx, quizData) {
  const user = ctx.from;
  if (!user) return;
  const name = escapeHtml([user.first_name, user.last_name].filter(Boolean).join(' '));
  const username = user.username ? `@${user.username}` : '—';
  const text = [
    '✅ <b>Пользователь прошёл тест!</b>',
    '',
    `👤 Имя: ${name}`,
    `📎 Username: ${username}`,
    `🆔 ID: <code>${user.id}</code>`,
    '',
    '<b>Результаты квиза:</b>',
    `• Направление: ${escapeHtml(quizData.direction || '—')}`,
    `• Уровень: ${escapeHtml(quizData.level || '—')}`,
    `• Травмы: ${escapeHtml(quizData.limitations || '—')}`,
    `• Оборудование: ${escapeHtml(quizData.equipment || '—')}`,
    `• Частота: ${escapeHtml(quizData.training_days || '—')}`,
    `• Цели: ${escapeHtml(quizData.goal || '—')}`,
    '',
    `📅 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
  await notifyAdmin(bot, text);
}

/**
 * ⚠️ Неполная заявка (не указаны имя или телефон)
 */
async function notifyIncompleteApplication(bot, ctx, packageData) {
  const user = ctx.from;
  if (!user) return;
  const name = escapeHtml([user.first_name, user.last_name].filter(Boolean).join(' '));
  const username = user.username ? `@${user.username}` : '—';
  const missing = [];
  if (!packageData.name) missing.push('имя');
  if (!packageData.phone) missing.push('телефон');
  const text = [
    '⚠️ <b>Неполная заявка на запись!</b>',
    '',
    `👤 Имя: ${name}`,
    `📎 Username: ${username}`,
    `🆔 ID: <code>${user.id}</code>`,
    '',
    `📦 Пакет: <b>${escapeHtml(packageData.package || '—')}</b>`,
    `💰 Цена: ${escapeHtml(packageData.package_price || '—')}`,
    `🎯 Направление: ${escapeHtml(packageData.direction || '—')}`,
    '',
    `❗ Не указано: ${missing.join(', ')}`,
    '',
    `📅 ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
  await notifyAdmin(bot, text);
}

module.exports = {
  notifyAdmin,
  notifyNewUser,
  notifyQuizCompleted,
  notifyIncompleteApplication,
};
