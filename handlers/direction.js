const { getUser, setUser } = require('../db');
const { directions, sssConfirm, formats } = require('../keyboards');
const { chooseDirection, sssPromo, chooseFormat } = require('../texts');
const STAGES = require('../stages');

/**
 * Выбор направления
 */
async function chooseDirectionHandler(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  setUser(userId, { stage: STAGES.CHOOSE_DIRECTION });
  await ctx.reply(chooseDirection, directions());
}

/**
 * Промо ССШ
 */
async function sssPromoHandler(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  setUser(userId, { stage: STAGES.SSS_PROMO });
  await ctx.reply(sssPromo, sssConfirm());
}

/**
 * Вернуться к направлениям
 */
async function backToDirections(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  
  setUser(userId, { stage: STAGES.CHOOSE_DIRECTION });
  await ctx.reply(chooseDirection, directions());
}

/**
 * Обработка выбора направления
 */
function processDirection(text) {
  if (text.includes('ССШ') || text.includes('Силачи')) {
    return 'ССШ';
  }
  if (text.includes('Гипертрофия')) {
    return 'Гипертрофия (набор массы)';
  }
  if (text.includes('Пауэрлифтинг')) {
    return 'Пауэрлифтинг (максимальная сила)';
  }
  if (text.includes('Фитнес')) {
    return 'Фитнес для девушек (форма & здоровье)';
  }
  return null;
}

/**
 * Обработка текста при выборе направления
 */
async function handleDirectionText(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  
  const user = getUser(userId);
  const isDirectionStage = user.stage === STAGES.CHOOSE_DIRECTION || 
                          user.stage === STAGES.SSS_PROMO;
  
  if (!isDirectionStage) return false;
  
  // Проверяем, является ли текст выбором направления
  const direction = processDirection(text);
  if (!direction) return false;
  
  setUser(userId, { 
    direction, 
    stage: STAGES.CHOOSE_FORMAT 
  });
  await ctx.reply(chooseFormat, formats());
  return true;
}

module.exports = {
  chooseDirectionHandler,
  sssPromoHandler,
  backToDirections,
  handleDirectionText
};
