const { setUser } = require('../db');
const { backToMenuOnly } = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');

async function materialsStart(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.MATERIALS });
  await sendImageAndText(ctx, 'screen_images', 'materials', texts.materialsIntro, backToMenuOnly());
}

module.exports = { materialsStart };
