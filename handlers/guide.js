const { getUser, setUser } = require('../db');
const { guideNavigation, mainMenu, checkSubscription, chooseGuideType } = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const config = require('../config');
const fs = require('fs');
const path = require('path');

const TOTAL_IMAGES_WOMEN = 15;
const TOTAL_IMAGES_MEN = 10;
const CHANNEL = config.CHANNEL_USERNAME;
const GUIDE_IMAGES_DIR_WOMEN = path.join(__dirname, '../guide_images_women');
const GUIDE_IMAGES_DIR_MEN = path.join(__dirname, '../guide_images_men');

function getTotalImages(guideType) {
  return guideType === 'women' ? TOTAL_IMAGES_WOMEN : TOTAL_IMAGES_MEN;
}

async function checkChannelSubscription(bot, userId) {
  try {
    const member = await bot.telegram.getChatMember(CHANNEL, userId);
    return ['member', 'administrator', 'creator'].includes(member.status);
  } catch (e) {
    return false;
  }
}

function getImagePath(index, guideType) {
  const formats = ['.jpg', '.jpeg', '.png'];
  const baseDir = guideType === 'women' ? GUIDE_IMAGES_DIR_WOMEN : GUIDE_IMAGES_DIR_MEN;
  const basePath = path.join(baseDir, 'guide_' + (index + 1));
  for (const ext of formats) {
    const p = basePath + ext;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function showGuideImage(ctx, imageIndex, guideType, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  const imagePath = getImagePath(imageIndex, guideType);
  if (!imagePath) {
    await ctx.reply(
      `Картинка ${imageIndex + 1} не найдена. Добавьте guide_${imageIndex + 1}.jpg в guide_images_${guideType}/`,
      mainMenu()
    );
    setUser(userId, { stage: STAGES.MENU });
    return;
  }
  const totalImages = getTotalImages(guideType);
  const isLast = imageIndex === totalImages - 1;
  try {
    await ctx.replyWithPhoto(
      { source: imagePath },
      { reply_markup: guideNavigation(isLast).reply_markup }
    );
    setUser(userId, {
      stage: STAGES.GUIDE_GALLERY,
      guide_image_index: imageIndex,
      guide_type: guideType,
    });
  } catch (e) {
    console.error('Ошибка при отправке картинки:', e.message);
    await ctx.reply('Ошибка при отправке картинки.', mainMenu());
    setUser(userId, { stage: STAGES.MENU });
  }
}

async function startGuide(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  const ok = await checkChannelSubscription(bot, userId);
  if (!ok) {
    await ctx.reply(
      'Для получения гайда подпишись на канал:\n\n📢 ' + CHANNEL + '\nhttps://t.me/FitnessNaMaximum\n\nПосле подписки нажми «✅ Я подписался».',
      { reply_markup: checkSubscription().reply_markup }
    );
    setUser(userId, { stage: STAGES.CHOOSE_GUIDE_TYPE });
    return;
  }
  await showGuideTypeSelection(ctx);
}

async function showGuideTypeSelection(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.CHOOSE_GUIDE_TYPE });
  await ctx.reply(texts.chooseGuideType, chooseGuideType());
}

async function checkSubscriptionAndShowType(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCbQuery?.('Проверяю подписку...');
  const ok = await checkChannelSubscription(bot, userId);
  if (!ok) {
    await ctx.reply(
      '❌ Ты ещё не подписан. Подпишись на ' + CHANNEL + ', затем нажми «✅ Я подписался» снова.',
      { reply_markup: checkSubscription().reply_markup }
    );
    return;
  }
  await showGuideTypeSelection(ctx);
}

async function startWomenGuide(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  await showGuideImage(ctx, 0, 'women', bot);
}

async function startMenGuide(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  await showGuideImage(ctx, 0, 'men', bot);
}

async function nextGuideImage(ctx, bot) {
  const userId = ctx.from?.id;
  if (!userId) return;
  const user = getUser(userId);
  const cur = user.guide_image_index ?? 0;
  const guideType = user.guide_type || 'women';
  const next = cur + 1;
  const total = getTotalImages(guideType);
  if (next >= total) {
    await ctx.answerCbQuery?.('Это последняя картинка!');
    return;
  }
  await ctx.answerCbQuery?.();
  await showGuideImage(ctx, next, guideType, bot);
}

async function backToMenuFromGuide(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  await ctx.answerCbQuery?.();
  setUser(userId, { stage: STAGES.MENU });
  await ctx.reply(texts.backToMenu, mainMenu());
}

module.exports = {
  startGuide,
  checkSubscriptionAndShowType,
  showGuideTypeSelection,
  startWomenGuide,
  startMenGuide,
  nextGuideImage,
  backToMenuFromGuide,
};
