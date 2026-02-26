const { Markup } = require('telegraf');
const { getUser, setUser } = require('../db');
const { mainMenu, remove } = require('../keyboards');
const { askName, askPhone, thankYou } = require('../texts');
const STAGES = require('../stages');
const config = require('../config');
const { notifyPackageApplication } = require('./notify');

async function handleRegistration(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.PACKAGE_DETAIL && user.stage !== STAGES.OFFER) return false;
  setUser(userId, { stage: STAGES.ASK_NAME, awaiting: 'package' });
  await ctx.reply(askName, remove());
  return true;
}

async function handleName(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.ASK_NAME) return false;
  setUser(userId, { name: text.trim(), stage: STAGES.ASK_PHONE });
  await ctx.reply(askPhone, remove());
  return true;
}

async function handlePhone(ctx, text, bot) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.ASK_PHONE) return false;
  const phone = text.trim();
  setUser(userId, { phone });

  if (user.awaiting === 'package' && user.package) {
    await sendPackageReport(bot, userId);
    setUser(userId, { stage: STAGES.MENU, awaiting: null });
    await ctx.reply(thankYou, mainMenu());
  } else {
    await sendReportToAdmin(bot, userId, phone);
    setUser(userId, { stage: STAGES.MENU });
    await ctx.reply(thankYou, mainMenu());
  }
  return true;
}

function reportLines(user, extras = {}) {
  const u = user;
  return [
    '🔔 НОВАЯ ЗАЯВКА!',
    '',
    `Пользователь: ${u.name || '—'} ${u.username ? `(@${u.username})` : ''}`,
    `Telegram ID: ${extras.userId ?? ''}`,
    `Направление: ${extras.direction ?? u.direction ?? u.program_direction ?? '—'}`,
    ...(extras.package ? [`Пакет: ${extras.package} ${extras.package_price ? `(${extras.package_price})` : ''}`] : []),
    '',
    'Квиз:',
    `• Уровень: ${u.level ?? '—'}`,
    `• Травмы: ${u.limitations ?? '—'}`,
    `• Оборудование: ${u.equipment ?? '—'}`,
    `• Частота: ${u.training_days ?? '—'}`,
    `• Цель: ${u.goal ?? '—'}`,
    '',
    `Время заявки: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
}

async function sendPackageReport(bot, userId, ctx) {
  const user = getUser(userId);
  const adminId = config.ADMIN_CHAT_ID;
  const payload = {
    userId,
    direction: user.direction || user.program_direction,
    package: user.package,
    package_price: user.package_price,
  };
  const report = reportLines(user, { ...payload, userId: String(userId) });

  if (adminId && adminId !== '0') {
    try {
      const writeLink = `https://t.me/${config.CAPTAIN_USERNAME}`;
      await bot.telegram.sendMessage(adminId, report, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('📞 Написать клиенту', `tg://user?id=${userId}`)],
        ]).reply_markup,
      });
    } catch (e) {
      console.error('Ошибка отправки отчета админу:', e.message);
    }
  } else {
    console.log('=== ОТЧЕТ ===\n' + report + '\n=============');
  }
}

async function sendReportToAdmin(bot, userId, phone) {
  const user = getUser(userId);
  const report = [
    '🔔 НОВЫЙ ЛИД!',
    `Имя: ${user.name || '—'}`,
    `Тел: ${phone}`,
    `Напр: ${user.direction || '—'}`,
    `Травмы: ${user.limitations || '—'}`,
    `Цель: ${user.goal || '—'}`,
    `Город: ${user.city || '—'}`,
    `Уровень: ${user.level || '—'}`,
    `График: ${user.training_days || '—'}`,
  ].join('\n');

  const adminId = config.ADMIN_CHAT_ID;
  if (adminId && adminId !== '0') {
    try {
      await bot.telegram.sendMessage(adminId, report);
    } catch (e) {
      console.error('Ошибка отправки отчета админу:', e.message);
    }
  } else {
    console.log('=== ОТЧЕТ ===\n' + report + '\n=============');
  }
}

module.exports = {
  handleRegistration,
  handleName,
  handlePhone,
  sendPackageReport,
  sendReportToAdmin,
};
