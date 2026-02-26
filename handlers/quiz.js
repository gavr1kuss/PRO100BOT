const { getUser, setUser } = require('../db');
const { 
  formats, 
  services, 
  levels, 
  limitations, 
  equipment, 
  trainingDays, 
  goals, 
  cities,
  offer,
  remove
} = require('../keyboards');
const { 
  chooseFormat, 
  chooseService, 
  askLevel,
  askLimitations,
  askLimitationsText,
  askEquipment,
  askTrainingDays,
  askGoal,
  askCity,
  askCityText,
  offer: offerText
} = require('../texts');
const STAGES = require('../stages');

/**
 * Обработка выбора формата
 */
async function handleFormat(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.CHOOSE_FORMAT) return false;
  
  const isFormat = text.includes('Онлайн') || 
                   text.includes('Зал') || 
                   text.includes('Смешанный');
  
  if (!isFormat) return false;
  
  setUser(userId, { 
    format: text, 
    stage: STAGES.CHOOSE_SERVICE 
  });
  await ctx.reply(chooseService, services());
  return true;
}

/**
 * Обработка выбора услуги
 */
async function handleService(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.CHOOSE_SERVICE) return false;
  
  const isService = text.includes('Консультация') || 
                    text.includes('Программа') || 
                    text.includes('Персональные') || 
                    text.includes('Сопровождение');
  
  if (!isService) return false;
  
  setUser(userId, { 
    service: text, 
    stage: STAGES.QUIZ_LEVEL 
  });
  await ctx.reply(askLevel, levels());
  return true;
}

/**
 * Обработка уровня опыта
 */
async function handleLevel(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_LEVEL) return false;
  
  setUser(userId, { 
    level: text, 
    stage: STAGES.QUIZ_LIMITATIONS 
  });
  await ctx.reply(askLimitations, limitations());
  return true;
}

/**
 * Обработка ограничений/травм
 */
async function handleLimitations(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_LIMITATIONS) return false;
  
  if (text === '✍️ Другое (напишу сам)') {
    setUser(userId, { stage: STAGES.QUIZ_LIMITATIONS_TEXT });
    await ctx.reply(askLimitationsText, remove());
    return true;
  }
  
  setUser(userId, { 
    limitations: text, 
    stage: STAGES.QUIZ_EQUIPMENT 
  });
  await ctx.reply(askEquipment, equipment());
  return true;
}

/**
 * Обработка текста ограничений
 */
async function handleLimitationsText(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_LIMITATIONS_TEXT) return false;
  
  setUser(userId, { 
    limitations: text, 
    stage: STAGES.QUIZ_EQUIPMENT 
  });
  await ctx.reply(askEquipment, equipment());
  return true;
}

/**
 * Обработка оборудования
 */
async function handleEquipment(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_EQUIPMENT) return false;
  
  setUser(userId, { 
    equipment: text, 
    stage: STAGES.QUIZ_DAYS 
  });
  await ctx.reply(askTrainingDays, trainingDays());
  return true;
}

/**
 * Обработка дней тренировок
 */
async function handleTrainingDays(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_DAYS) return false;
  
  setUser(userId, { 
    training_days: text, 
    stage: STAGES.QUIZ_GOAL 
  });
  await ctx.reply(askGoal, goals());
  return true;
}

/**
 * Обработка цели
 */
async function handleGoal(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_GOAL) return false;
  
  setUser(userId, { 
    goal: text, 
    stage: STAGES.QUIZ_CITY 
  });
  await ctx.reply(askCity, cities());
  return true;
}

/**
 * Обработка города
 */
async function handleCity(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_CITY) return false;
  
  if (text === '📍 Другой (напишу сам)') {
    setUser(userId, { stage: STAGES.QUIZ_CITY_TEXT });
    await ctx.reply(askCityText, remove());
    return true;
  }
  
  setUser(userId, { 
    city: text, 
    stage: STAGES.OFFER 
  });
  
  const updatedUser = getUser(userId);
  await ctx.reply(offerText(updatedUser.training_days), offer());
  return true;
}

/**
 * Обработка текста города
 */
async function handleCityText(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  if (user.stage !== STAGES.QUIZ_CITY_TEXT) return false;
  
  setUser(userId, { 
    city: text, 
    stage: STAGES.OFFER 
  });
  
  const updatedUser = getUser(userId);
  await ctx.reply(offerText(updatedUser.training_days), offer());
  return true;
}

module.exports = {
  handleFormat,
  handleService,
  handleLevel,
  handleLimitations,
  handleLimitationsText,
  handleEquipment,
  handleTrainingDays,
  handleGoal,
  handleCity,
  handleCityText
};
