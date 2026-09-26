const { Markup } = require('telegraf');
const { getUser, setUser } = require('../db');
const { trialDirection, levels, limitations, equipment, trainingDays, goals, trialFinal } = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');
const { notifyQuizCompleted } = require('./notify');

const FLOW = 'flow_images';

let _bot = null;
function setBotInstance(bot) { _bot = bot; }

async function sendOptionalImageAndText(ctx, imageName, text, keyboard) {
  await sendImageAndText(ctx, FLOW, imageName, text, keyboard);
}

function directionFromText(text) {
  if (text.includes('Гипертрофия')) return 'Гипертрофия';
  if (text.includes('Пауэрлифтинг')) return 'Пауэрлифтинг';
  if (text.includes('Фитнес')) return 'Фитнес';
  if (text.includes('ССШ') || text.includes('Силачи')) return 'ССШ (Силачи старой школы)';
  return null;
}

async function startTrialIntro(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.TRIAL_INTRO });
  const kb = Markup.keyboard([['➡️ Дальше']]).resize();
  await sendOptionalImageAndText(ctx, 'trial_intro', texts.trialIntro, kb);
}

async function handleTrialIntro(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_INTRO) return false;
  if (!text.includes('Дальше')) return false;
  setUser(userId, { stage: STAGES.TRIAL_DIRECTION });
  await sendOptionalImageAndText(ctx, 'trial_direction', texts.trialDirection, trialDirection());
  return true;
}

async function handleTrialDirection(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_DIRECTION) return false;
  const dir = directionFromText(text);
  if (!dir) return false;
  setUser(userId, { direction: dir, stage: STAGES.TRIAL_QUIZ_1 });
  await sendOptionalImageAndText(ctx, 'trial_quiz_1', texts.askLevel, levels());
  return true;
}

async function handleQuiz1(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_1) return false;
  const valid = ['👶 Новичок', '💪 Любитель', '🏆 Продвинутый'].some((l) => text.includes(l) || l.includes(text));
  if (!valid) return false;
  setUser(userId, { level: text, stage: STAGES.TRIAL_QUIZ_2, selected_injuries: '[]' });
  await sendOptionalImageAndText(ctx, 'trial_quiz_2', texts.askLimitations, limitations());
  return true;
}

// Маппинг callback data к меткам травм
const INJURY_LABELS = {
  injury_spine: '🔙 Спина',
  injury_shoulders: '💪 Плечи',
  injury_elbows: '💪 Локти',
  injury_knees: '🦵 Колени',
  injury_none: 'Никаких травм',
};

// Обновление клавиатуры с отмеченными травмами
function limitationsWithSelection(selected) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(selected.includes('injury_spine') ? '✅ Спина' : '🔙 Спина', 'injury_spine')],
    [Markup.button.callback(selected.includes('injury_shoulders') ? '✅ Плечи' : '💪 Плечи', 'injury_shoulders')],
    [Markup.button.callback(selected.includes('injury_elbows') ? '✅ Локти' : '💪 Локти', 'injury_elbows')],
    [Markup.button.callback(selected.includes('injury_knees') ? '✅ Колени' : '🦵 Колени', 'injury_knees')],
    [Markup.button.callback(selected.includes('injury_none') ? '✅ Никаких травм' : 'Никаких травм', 'injury_none')],
    [Markup.button.callback('✅ Готово', 'injuries_done')],
  ]);
}

async function handleInjuryCallback(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_2) return false;

  const data = ctx.callbackQuery.data;
  let selected = [];
  try { selected = JSON.parse(user.selected_injuries || '[]'); } catch (e) { }

  if (data === 'injury_none') {
    // Если выбрали "никаких травм", очищаем остальные
    selected = ['injury_none'];
  } else if (data.startsWith('injury_')) {
    // Убираем "никаких травм" если добавляем травму
    selected = selected.filter(s => s !== 'injury_none');

    if (selected.includes(data)) {
      selected = selected.filter(s => s !== data);
    } else {
      selected.push(data);
    }
  }

  setUser(userId, { selected_injuries: JSON.stringify(selected) });

  try {
    await ctx.editMessageReplyMarkup(limitationsWithSelection(selected).reply_markup);
  } catch (e) {
    // ignore if message wasn't modified
  }

  await ctx.answerCbQuery();
  return true;
}

async function handleInjuriesDone(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_2) return false;

  let selected = [];
  try { selected = JSON.parse(user.selected_injuries || '[]'); } catch (e) { }
  const labels = selected.map(s => INJURY_LABELS[s] || s).join(', ') || 'Не указано';

  setUser(userId, { limitations: labels, stage: STAGES.TRIAL_QUIZ_3 });
  await ctx.answerCbQuery();
  await sendOptionalImageAndText(ctx, 'trial_quiz_3', texts.askEquipment, equipment());
  return true;
}

async function handleQuiz3(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_3) return false;
  const valid = ['Полный зал', 'Пару снарядов', 'Ничего нет'].some((e) => text.includes(e));
  if (!valid) return false;
  setUser(userId, { equipment: text, stage: STAGES.TRIAL_QUIZ_4 });
  await sendOptionalImageAndText(ctx, 'trial_quiz_4', texts.askTrainingDays, trainingDays());
  return true;
}

async function handleQuiz4(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_4) return false;
  const valid = ['2-3 раза', '4-5 раз', '6-7 раз'].some((d) => text.includes(d));
  if (!valid) return false;
  setUser(userId, { training_days: text, stage: STAGES.TRIAL_QUIZ_5, selected_goals: JSON.stringify([]) });
  await sendOptionalImageAndText(ctx, 'trial_quiz_5', texts.askGoal, goals());
  return true;
}

// Маппинг callback data к меткам целей
const GOAL_LABELS = {
  goal_confidence: '💪 Прокачать уверенность',
  goal_partner: '❤️ Начать нравиться партнеру',
  goal_compete: '🏆 Участвовать в соревнованиях',
  goal_prove: '🔥 Доказать всем, на что способен',
  goal_health: '🏃 Быть здоровым и энергичным',
};

// Обновление клавиатуры с отмеченными целями
function goalsWithSelection(selected) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(selected.includes('goal_confidence') ? '✅ Прокачать уверенность' : '💪 Прокачать уверенность', 'goal_confidence')],
    [Markup.button.callback(selected.includes('goal_partner') ? '✅ Начать нравиться партнеру' : '❤️ Начать нравиться партнеру', 'goal_partner')],
    [Markup.button.callback(selected.includes('goal_compete') ? '✅ Участвовать в соревнованиях' : '🏆 Участвовать в соревнованиях', 'goal_compete')],
    [Markup.button.callback(selected.includes('goal_prove') ? '✅ Доказать всем, на что способен' : '🔥 Доказать всем, на что способен', 'goal_prove')],
    [Markup.button.callback(selected.includes('goal_health') ? '✅ Быть здоровым и энергичным' : '🏃 Быть здоровым и энергичным', 'goal_health')],
    [Markup.button.callback('✅ Готово', 'goals_done')],
  ]);
}

async function handleGoalCallback(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_5) return false;

  const data = ctx.callbackQuery.data;
  let selected = [];
  try { selected = JSON.parse(user.selected_goals || '[]'); } catch (e) { }

  if (data.startsWith('goal_') && data !== 'goals_done') {
    if (selected.includes(data)) {
      selected = selected.filter(s => s !== data);
    } else {
      selected.push(data);
    }
  }

  setUser(userId, { selected_goals: JSON.stringify(selected) });

  try {
    await ctx.editMessageReplyMarkup(goalsWithSelection(selected).reply_markup);
  } catch (e) {
    // ignore if message wasn't modified
  }

  await ctx.answerCbQuery();
  return true;
}

async function handleGoalsDone(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.TRIAL_QUIZ_5) return false;

  let selected = [];
  try { selected = JSON.parse(user.selected_goals || '[]'); } catch (e) { }
  const labels = selected.map(s => GOAL_LABELS[s] || s).join(', ') || 'Не указано';

  setUser(userId, { goal: labels, stage: STAGES.TRIAL_FINAL });
  await ctx.answerCbQuery();
  const name = ctx.from?.first_name || '';
  const msg = texts.trialFinal(name, user.direction);
  await sendOptionalImageAndText(ctx, 'trial_final', msg, trialFinal());

  // Уведомление админу о прохождении теста
  if (_bot) {
    const freshUser = getUser(userId);
    await notifyQuizCompleted(_bot, ctx, {
      direction: freshUser.direction || '—',
      level: freshUser.level || '—',
      limitations: freshUser.limitations || '—',
      equipment: freshUser.equipment || '—',
      training_days: freshUser.training_days || '—',
      goal: labels,
    });
  }

  return true;
}

module.exports = {
  startTrialIntro,
  handleTrialIntro,
  handleTrialDirection,
  handleQuiz1,
  handleInjuryCallback,
  handleInjuriesDone,
  handleQuiz3,
  handleQuiz4,
  handleGoalCallback,
  handleGoalsDone,
  setBotInstance,
};
