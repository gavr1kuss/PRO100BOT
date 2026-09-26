const { getUser, setUser, countReferrals } = require('../db');
const {
  giftsCheckSub,
  giftsSubOk,
  giftTrialLocked,
  giftTrialUnlocked,
  mainMenu,
} = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const config = require('../config');
const { sendImageAndText } = require('../lib/images');

const CHANNEL = config.CHANNEL_USERNAME;

async function checkChannelSubscription(bot, userId) {
  try {
    const member = await bot.telegram.getChatMember(CHANNEL, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (e) {
    return false;
  }
}

async function giftsStart(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.GIFTS_CHECK_SUB });
  const ok = await checkChannelSubscription(bot, userId);
  if (!ok) {
    await sendImageAndText(ctx, 'screen_images', 'gifts_intro', texts.giftsCheckSub, giftsCheckSub());
    return;
  }
  await showGiftsList(ctx);
}

async function handleGiftsCheckSub(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCbQuery?.('Проверяю...');
  const ok = await checkChannelSubscription(bot, userId);
  if (!ok) {
    await sendImageAndText(ctx, 'screen_images', 'gifts_intro', texts.giftsNotSub, giftsCheckSub());
    return;
  }
  setUser(userId, { stage: STAGES.GIFTS });
  await sendImageAndText(ctx, 'screen_images', 'gifts_ok', texts.giftsSubOk, giftsSubOk());
}

async function showGiftsList(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.GIFTS });
  await sendImageAndText(ctx, 'screen_images', 'gifts_ok', texts.giftsSubOk, giftsSubOk());
}

async function handleGiftChoice(ctx, text, bot) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.GIFTS) return false;

  if (text.includes('Гайд по анализам')) {
    const guide = require('./guide');
    setUser(userId, { stage: STAGES.CHOOSE_GUIDE_TYPE });
    await guide.showGuideTypeSelection(ctx);
    return true;
  }

  const n = countReferrals(userId);

  if (text.includes('Пробная онлайн')) {
    if (n >= 2) {
      setUser(userId, { stage: STAGES.GIFT_TRIAL_ONLINE, gift_type: 'trial_online' });
      await ctx.reply(texts.giftTrialOnlineUnlocked, giftTrialUnlocked());
    } else {
      await ctx.reply(texts.giftTrialOnlineLocked(n), giftTrialLocked());
    }
    return true;
  }

  if (text.includes('Пробная оффлайн') || text.includes('оффлайн')) {
    if (n >= 5) {
      setUser(userId, { stage: STAGES.GIFT_TRIAL_OFFLINE, gift_type: 'trial_offline' });
      await ctx.reply(texts.giftTrialOfflineUnlocked, giftTrialUnlocked());
    } else {
      await ctx.reply(texts.giftTrialOfflineLocked(n), giftTrialLocked());
    }
    return true;
  }

  if (text.includes('Программа тренировок') && !text.includes('Пробная')) {
    if (n >= 1) {
      setUser(userId, { gift_type: 'program' });
      await ctx.reply('🎁 Подарок «Программа тренировок» разблокирован! Напиши @' + config.CAPTAIN_USERNAME + ' чтобы забрать.', giftTrialUnlocked());
    } else {
      await ctx.reply(texts.giftProgramLocked(n), giftTrialLocked());
    }
    return true;
  }

  if (text.includes('Программа питания')) {
    if (n >= 1) {
      setUser(userId, { gift_type: 'nutrition' });
      await ctx.reply('🎁 Подарок «Программа питания» разблокирован! Напиши @' + config.CAPTAIN_USERNAME + ' чтобы забрать.', giftTrialUnlocked());
    } else {
      await ctx.reply(texts.giftNutritionLocked(n), giftTrialLocked());
    }
    return true;
  }

  return false;
}

async function handleGiftTrialUnlocked(ctx, text, bot) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  const stage = user.stage;
  if (stage !== STAGES.GIFT_TRIAL_ONLINE && stage !== STAGES.GIFT_TRIAL_OFFLINE) return false;
  if (text.includes('Другие подарки')) {
    await showGiftsList(ctx);
    return true;
  }
  if (!text.includes('Записаться')) return false;

  const un = ctx.from?.username;
  if (un) setUser(userId, { username: un });
  const u2 = getUser(userId);
  const adminId = config.ADMIN_CHAT_ID;
  const kind = stage === STAGES.GIFT_TRIAL_ONLINE ? 'пробную онлайн тренировку' : 'пробную оффлайн тренировку';
  const report = `🔔 Заявка на подарок!\n\nКто-то хочет записаться на ${kind}.\n\nUser ID: ${userId}\nИмя: ${u2.name || '—'}\nUsername: ${u2.username ? '@' + u2.username : '—'}`;
  if (adminId && adminId !== '0') {
    try {
      await bot.telegram.sendMessage(adminId, report);
    } catch (e) {
      console.error('Gift report error:', e.message);
    }
  }
  setUser(userId, { stage: STAGES.GIFTS });
  await ctx.reply('Заявка отправлена! Капитан свяжется с тобой.', giftsSubOk());
  return true;
}

async function handleGiftTrialLocked(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.GIFTS) return false;
  if (text.includes('Другие подарки')) {
    await showGiftsList(ctx);
    return true;
  }
  if (text.includes('Получить реферальную ссылку') || text.includes('Моя статистика')) {
    const ref = require('./referral');
    await ref.referralStart(ctx);
    return true;
  }
  return false;
}

module.exports = {
  giftsStart,
  handleGiftsCheckSub,
  handleGiftChoice,
  handleGiftTrialUnlocked,
  handleGiftTrialLocked,
  checkChannelSubscription,
};
