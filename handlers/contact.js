const { setUser } = require('../db');
const { backToMenuOnly } = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');

async function contactStart(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.CONTACT });
  await sendImageAndText(ctx, 'screen_images', 'contact', texts.contactIntro, backToMenuOnly());
}

module.exports = { contactStart };
