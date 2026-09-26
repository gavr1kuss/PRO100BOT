const { getUser, setUser, countReferrals } = require('../db');
const { referralActions } = require('../keyboards');
const texts = require('../texts');
const config = require('../config');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');

function refStatus(count) {
  if (count >= 5) return 'Легенда';
  if (count >= 3) return 'Ветеран';
  if (count >= 2) return 'Боец';
  if (count >= 1) return 'Моряк';
  return 'Новобранец';
}

function buildReferralLink(userId) {
  const user = getUser(userId);
  const code = user.ref_code || 'u' + userId;
  const bot = config.BOT_USERNAME.replace('@', '');
  return `https://t.me/${bot}?start=ref_${code}`;
}

async function referralStart(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  setUser(userId, { stage: STAGES.REFERRAL });
  const count = countReferrals(userId);
  const link = buildReferralLink(userId);
  const msg = texts.referralIntro(count, refStatus(count)) + '\n' + texts.referralLink(link);
  await sendImageAndText(ctx, 'screen_images', 'referral', msg, referralActions(link));
}

module.exports = { referralStart, buildReferralLink, refStatus, countReferrals };
