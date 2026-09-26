require('dotenv').config();
const { Telegraf } = require('telegraf');

const { initDb, getUser, setUser, getUserByRefCode, userExists } = require('./db');
const { notifyNewUser } = require('./handlers/notify');
const STAGES = require('./stages');

const menu = require('./handlers/menu');
const trial = require('./handlers/trial');
const programs = require('./handlers/programs');
const referral = require('./handlers/referral');
const gifts = require('./handlers/gifts');
const materials = require('./handlers/materials');
const contact = require('./handlers/contact');
const guide = require('./handlers/guide');
const registration = require('./handlers/registration');

const bot = new Telegraf(process.env.BOT_TOKEN);
trial.setBotInstance(bot);
programs.setBotInstance(bot);

function getUserId(ctx) {
  return ctx.from?.id || null;
}

// ========== /start ==========

bot.start(async (ctx) => {
  const userId = getUserId(ctx);
  if (!userId) return;
  const txt = ctx.message?.text || '';
  const isNew = !userExists(userId);
  getUser(userId);
  const refMatch = /\/start\s+ref_(.+)/.exec(txt);
  // Приглашённым считается только новый пользователь: иначе старые пользователи
  // могли бы «накручивать» друг другу рефералов и переходить от одного пригласившего к другому
  if (refMatch && isNew) {
    const referrerId = getUserByRefCode(refMatch[1].trim());
    if (referrerId && referrerId !== userId) {
      setUser(userId, { referred_by: referrerId });
    }
  }
  if (isNew) {
    await notifyNewUser(bot, ctx);
  }
  await trial.startTrialIntro(ctx);
});

// ========== /menu, /myid ==========

bot.command('menu', (ctx) => menu.goMenu(ctx));

bot.command('myid', (ctx) => {
  const id = getUserId(ctx);
  if (id) ctx.reply(`Твой ID: ${id}`);
});

// ========== Возврат в меню ==========

bot.hears('🔙 Вернуться в меню', (ctx) => menu.goMenu(ctx));
bot.hears('📋 Вернуться в меню', (ctx) => menu.goMenu(ctx));
bot.hears('📋 Открыть меню', (ctx) => menu.goMenu(ctx));

// ========== Главное меню ==========

bot.hears('💪 Программы тренировок', (ctx) => programs.programsStart(ctx));
bot.hears('🎯 Реферальная программа', (ctx) => referral.referralStart(ctx));
bot.hears('🎁 Твои подарки', (ctx) => gifts.giftsStart(ctx, bot));
bot.hears('📚 Полезные материалы', (ctx) => materials.materialsStart(ctx));
bot.hears('📞 Связаться с капитаном', (ctx) => contact.contactStart(ctx));
bot.hears('📥 Посмотреть гайд заново', (ctx) => guide.startGuide(ctx, bot));

// ========== Inline callbacks ==========

bot.action('guide_next', (ctx) => guide.nextGuideImage(ctx, bot));
bot.action('guide_back_to_menu', guide.backToMenuFromGuide);
bot.action('check_subscription', (ctx) => guide.checkSubscriptionAndShowType(ctx, bot));
bot.action('gifts_check_sub', (ctx) => gifts.handleGiftsCheckSub(ctx, bot));
bot.action('back_to_menu', (ctx) => {
  ctx.answerCbQuery?.();
  return menu.goMenu(ctx);
});

// Trial quiz callbacks (мультивыбор травм)
bot.action('injuries_done', (ctx) => trial.handleInjuriesDone(ctx));
bot.action(/^injury_/, (ctx) => trial.handleInjuryCallback(ctx));

// Trial quiz callbacks (мультивыбор целей)
bot.action('goals_done', (ctx) => trial.handleGoalsDone(ctx));
bot.action(/^goal_/, (ctx) => trial.handleGoalCallback(ctx));

// ========== Текстовые сообщения ==========

bot.on('text', async (ctx) => {
  const userId = getUserId(ctx);
  if (!userId) return;
  const text = ctx.message.text;
  const user = getUser(userId);

  // Финал испытаний
  if (user.stage === STAGES.TRIAL_FINAL) {
    if (text.includes('Забрать подарок')) {
      await guide.startGuide(ctx, bot);
      return;
    }
    if (text.includes('Открыть меню')) {
      await menu.goMenu(ctx);
      return;
    }
  }

  // Испытания
  if (await trial.handleTrialIntro(ctx, text)) return;
  if (await trial.handleTrialDirection(ctx, text)) return;
  if (await trial.handleQuiz1(ctx, text)) return;
  // Quiz 2 (травмы) теперь обрабатывается через callbacks
  if (await trial.handleQuiz3(ctx, text)) return;
  if (await trial.handleQuiz4(ctx, text)) return;
  // Quiz 5 (цели) теперь обрабатывается через callbacks

  // Регистрация (имя / телефон)
  if (await registration.handleName(ctx, text)) return;
  if (await registration.handlePhone(ctx, text, bot)) return;

  // Программы
  if (await programs.handleProgramDirection(ctx, text)) return;
  if (await programs.handlePackageChoice(ctx, text)) return;
  if (await programs.handlePackageDetail(ctx, text)) return;
  if (await programs.handlePackageContact(ctx, text, bot)) return;

  // Подарки
  if (await gifts.handleGiftChoice(ctx, text, bot)) return;
  if (await gifts.handleGiftTrialUnlocked(ctx, text, bot)) return;
  if (await gifts.handleGiftTrialLocked(ctx, text)) return;

  // Гайд М/Ж
  if (user.stage === STAGES.CHOOSE_GUIDE_TYPE) {
    if (text.includes('Женский') || text.includes('женщин')) {
      await guide.startWomenGuide(ctx, bot);
      return;
    }
    if (text.includes('Мужской') || text.includes('мужчин')) {
      await guide.startMenGuide(ctx, bot);
      return;
    }
  }

  // Игнор
});

// ========== Ошибки ==========

// Без этого любая ошибка в обработчике (например, пользователь заблокировал бота)
// останавливает весь бот до перезапуска
bot.catch((err, ctx) => {
  console.error(`❌ Ошибка при обработке апдейта ${ctx.update?.update_id}:`, err);
});

// ========== Запуск ==========

async function start() {
  try {
    await initDb();
    console.log('✅ База данных инициализирована');
    // launch() завершается только при остановке бота, поэтому о запуске сообщаем из колбэка
    await bot.launch(() => console.log('✅ БОТ ЗАПУЩЕН!'));
  } catch (e) {
    console.error('❌ Ошибка запуска:', e);
    process.exit(1);
  }
}

// В тестах бот не подключается к Telegram (см. test/bot.test.js)
if (process.env.NODE_ENV !== 'test') {
  start();
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = { bot };
