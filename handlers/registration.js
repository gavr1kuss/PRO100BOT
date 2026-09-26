const { Markup } = require('telegraf');
const { getUser, setUser } = require('../db');
const { mainMenu, remove } = require('../keyboards');
const { askPhone, thankYou } = require('../texts');
const STAGES = require('../stages');
const config = require('../config');

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
    `Телефон: ${u.phone || '—'}`,
    `Telegram ID: ${extras.userId ?? ''}`,
    `Направление: ${extras.direction || '—'}`,
    ...(extras.package ? [`Пакет: ${extras.package} ${extras.package_price ? `(${extras.package_price})` : ''}`] : []),
    '',
    'Квиз:',
    `• Направление: ${u.direction ?? '—'}`,
    `• Уровень: ${u.level ?? '—'}`,
    `• Травмы: ${u.limitations ?? '—'}`,
    `• Оборудование: ${u.equipment ?? '—'}`,
    `• Частота: ${u.training_days ?? '—'}`,
    `• Цель: ${u.goal ?? '—'}`,
    '',
    `Время заявки: ${new Date().toLocaleString('ru-RU')}`,
  ].join('\n');
}

async function sendPackageReport(bot, userId) {
  const user = getUser(userId);
  const adminId = config.ADMIN_CHAT_ID;
  const payload = {
    userId,
    // Направление программы, на которую записываются, важнее ответа из квиза
    direction: user.program_direction || user.direction,
    package: user.package,
    package_price: user.package_price,
  };
  const report = reportLines(user, { ...payload, userId: String(userId) });

  if (adminId && adminId !== '0') {
    // Ссылку tg://user?id= Telegram отклоняет, если клиент закрыл профиль настройками приватности
    const clientLink = user.username ? `https://t.me/${user.username}` : `tg://user?id=${userId}`;
    try {
      await bot.telegram.sendMessage(adminId, report, {
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.url('📞 Написать клиенту', clientLink)],
        ]).reply_markup,
      });
    } catch (e) {
      console.error('Ошибка отправки отчета админу:', e.message);
      // Повторяем без кнопки, чтобы заявка не потерялась
      try {
        await bot.telegram.sendMessage(adminId, report);
      } catch (e2) {
        console.error('Повторная отправка отчета админу не удалась:', e2.message);
      }
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
  handleName,
  handlePhone,
  sendPackageReport,
  sendReportToAdmin,
};
