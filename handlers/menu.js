const { getUser, setUser } = require('../db');
const { mainMenu, backToMenuOnly } = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');

async function goMenu(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.MENU });
  await sendImageAndText(ctx, 'screen_images', 'menu', texts.menuWelcome, mainMenu());
}

async function backToMenu(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.MENU });
  await sendImageAndText(ctx, 'screen_images', 'menu', texts.backToMenu, mainMenu());
}

module.exports = { goMenu, backToMenu };
