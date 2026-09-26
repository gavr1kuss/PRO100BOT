const { Markup } = require('telegraf');

const remove = () => Markup.removeKeyboard();

// —— Испытания ——
const trialDirection = () =>
  Markup.keyboard([
    ['🏋️ Гипертрофия', '⚙️ Пауэрлифтинг'],
    ['👙 Фитнес', '🔥 ССШ (Силачи старой школы)'],
  ]).resize();

const levels = () =>
  Markup.keyboard([
    ['👶 Новичок'],
    ['💪 Любитель'],
    ['🏆 Продвинутый'],
  ]).resize();

// Мультивыбор: selected — callback data отмеченных вариантов, они помечаются ✅
const limitations = (selected = []) =>
  Markup.inlineKeyboard([
    [Markup.button.callback(selected.includes('injury_spine') ? '✅ Спина' : '🔙 Спина', 'injury_spine')],
    [Markup.button.callback(selected.includes('injury_shoulders') ? '✅ Плечи' : '💪 Плечи', 'injury_shoulders')],
    [Markup.button.callback(selected.includes('injury_elbows') ? '✅ Локти' : '💪 Локти', 'injury_elbows')],
    [Markup.button.callback(selected.includes('injury_knees') ? '✅ Колени' : '🦵 Колени', 'injury_knees')],
    [Markup.button.callback(selected.includes('injury_none') ? '✅ Никаких травм' : 'Никаких травм', 'injury_none')],
    [Markup.button.callback('✅ Готово', 'injuries_done')],
  ]);

const equipment = () =>
  Markup.keyboard([
    ['💎 Полный зал'],
    ['🏠 Пару снарядов дома'],
    ['❌ Ничего нет'],
  ]).resize();

const trainingDays = () =>
  Markup.keyboard([
    ['2-3 раза'],
    ['4-5 раз'],
    ['6-7 раз'],
  ]).resize();

const goals = (selected = []) =>
  Markup.inlineKeyboard([
    [Markup.button.callback(selected.includes('goal_confidence') ? '✅ Прокачать уверенность' : '💪 Прокачать уверенность', 'goal_confidence')],
    [Markup.button.callback(selected.includes('goal_partner') ? '✅ Начать нравиться партнеру' : '❤️ Начать нравиться партнеру', 'goal_partner')],
    [Markup.button.callback(selected.includes('goal_compete') ? '✅ Участвовать в соревнованиях' : '🏆 Участвовать в соревнованиях', 'goal_compete')],
    [Markup.button.callback(selected.includes('goal_prove') ? '✅ Доказать всем, на что способен' : '🔥 Доказать всем, на что способен', 'goal_prove')],
    [Markup.button.callback(selected.includes('goal_health') ? '✅ Быть здоровым и энергичным' : '🏃 Быть здоровым и энергичным', 'goal_health')],
    [Markup.button.callback('✅ Готово', 'goals_done')],
  ]);

const trialFinal = () =>
  Markup.keyboard([
    ['🎁 Забрать подарок'],
    ['📋 Открыть меню'],
  ]).resize();

// —— Гайд ——
const chooseGuideType = () =>
  Markup.keyboard([
    ['👨 Мужской гайд', '👩 Женский гайд'],
    ['📋 Открыть меню'],
  ]).resize();

const guideNavigation = (isLast = false) => {
  const rows = [];
  if (!isLast) {
    rows.push([Markup.button.callback('➡️ Дальше', 'guide_next')]);
  }
  rows.push([
    Markup.button.url('ℹ️ Подробнее', 'https://t.me/papochka86'),
    Markup.button.callback('📋 В главное меню', 'guide_back_to_menu'),
  ]);
  return Markup.inlineKeyboard(rows);
};

const checkSubscription = () =>
  Markup.inlineKeyboard([
    [Markup.button.url('📢 Подписаться на канал', 'https://t.me/FitnessNaMaximum')],
    [Markup.button.callback('✅ Я подписался! Проверить', 'check_subscription')],
    [Markup.button.callback('📋 В главное меню', 'guide_back_to_menu')],
  ]);

// —— Главное меню ——
const mainMenu = () =>
  Markup.keyboard([
    ['💪 Программы тренировок', '🎯 Реферальная программа'],
    ['🎁 Твои подарки', '📚 Полезные материалы'],
    ['📞 Связаться с капитаном'],
    ['📥 Посмотреть гайд заново'],
  ]).resize();

const backToMenuOnly = () =>
  Markup.keyboard([['🔙 Вернуться в меню']]).resize();

// —— Программы ——
const programDirections = () =>
  Markup.keyboard([
    ['🏋️ Гипертрофия', '⚙️ Пауэрлифтинг'],
    ['👙 Фитнес', '🔥 ССШ'],
    ['🔙 Вернуться в меню'],
  ]).resize();

const packages = () =>
  Markup.keyboard([
    ['📖 STARTER', '📖 ONLINE CREW'],
    ['📖 VIP КАПИТАН', '📖 ГИБРИД'],
    ['🔙 Вернуться в меню'],
  ]).resize();

const packageDetail = () =>
  Markup.keyboard([
    ['✅ Записаться на пакет'],
    ['🔙 Другие программы'],
  ]).resize();

const packageAskContact = () =>
  Markup.keyboard([
    ['📞 Оставить заявку'],
    ['✏️ Изменить данные'],
  ]).resize();

const packageSent = () =>
  Markup.keyboard([['📋 Вернуться в меню']]).resize();

// —— Реферальная ——
const referralActions = (refLink) =>
  Markup.inlineKeyboard([
    [Markup.button.url('📤 Поделиться', `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Присоединяйся к команде! 💪')}`)],
    [Markup.button.callback('📋 В меню', 'back_to_menu')],
  ]);

const referralBack = () =>
  Markup.keyboard([['🔙 Вернуться в меню']]).resize();

// —— Подарки ——
const giftsCheckSub = () =>
  Markup.inlineKeyboard([
    [Markup.button.url('📢 Подписаться на канал', 'https://t.me/FitnessNaMaximum')],
    [Markup.button.callback('✅ Проверить', 'gifts_check_sub')],
    [Markup.button.callback('📋 В меню', 'back_to_menu')],
  ]);

const giftsSubOk = () =>
  Markup.keyboard([
    ['🩺 Гайд по анализам'],
    ['💪 Пробная онлайн тренировка', '💪 Пробная оффлайн тренировка'],
    ['📋 Программа тренировок', '🍴 Программа питания'],
    ['🔙 Вернуться в меню'],
  ]).resize();

const giftTrialLocked = () =>
  Markup.keyboard([
    ['📲 Получить реферальную ссылку'],
    ['📊 Моя статистика'],
    ['🔙 Другие подарки'],
  ]).resize();

const giftTrialUnlocked = () =>
  Markup.keyboard([
    ['✅ Записаться на пробную тренировку'],
    ['🔙 Другие подарки'],
  ]).resize();

const backToGifts = () =>
  Markup.keyboard([['🔙 Другие подарки']]).resize();

module.exports = {
  remove,
  trialDirection,
  levels,
  limitations,
  equipment,
  trainingDays,
  goals,
  trialFinal,
  chooseGuideType,
  guideNavigation,
  checkSubscription,
  mainMenu,
  backToMenuOnly,
  programDirections,
  packages,
  packageDetail,
  packageAskContact,
  packageSent,
  referralActions,
  referralBack,
  giftsCheckSub,
  giftsSubOk,
  giftTrialLocked,
  giftTrialUnlocked,
  backToGifts,
};
