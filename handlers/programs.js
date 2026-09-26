const { getUser, setUser } = require('../db');
const {
  programDirections,
  packages,
  packageDetail,
  packageAskContact,
  packageSent,
  mainMenu,
  remove,
} = require('../keyboards');
const texts = require('../texts');
const STAGES = require('../stages');
const { sendImageAndText } = require('../lib/images');
const { notifyIncompleteApplication } = require('./notify');

let _bot = null;
function setBotInstance(bot) { _bot = bot; }

const PACKAGES = {
  '📖 STARTER': { name: 'STARTER', price: '4 000 ₽', image: 'package_starter' },
  '📖 ONLINE CREW': { name: 'ONLINE CREW', price: '7 000 ₽/месяц', image: 'package_online_crew' },
  '📖 VIP КАПИТАН': { name: 'VIP КАПИТАН', price: '16 000 ₽ / 8 трен.', image: 'package_vip' },
  '📖 ГИБРИД': { name: 'ГИБРИД', price: '15 000 ₽/месяц', image: 'package_hybrid' },
};

const PACKAGE_TEXTS = {
  '📖 STARTER': texts.packageStarter,
  '📖 ONLINE CREW': texts.packageOnlineCrew,
  '📖 VIP КАПИТАН': texts.packageVip,
  '📖 ГИБРИД': texts.packageHybrid,
};

function matchPackage(text) {
  return Object.keys(PACKAGES).find((k) => text.includes(k.replace(/^📖\s*/, '')) || text === k);
}

async function programsStart(ctx) {
  const userId = ctx.from?.id;
  if (!userId) return;
  const user = getUser(userId);
  setUser(userId, { stage: STAGES.PROGRAMS });
  await sendImageAndText(
    ctx,
    'screen_images',
    'programs',
    texts.programsIntro(user.direction),
    programDirections()
  );
}

async function handleProgramDirection(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.PROGRAMS) return false;
  const dirs = ['Гипертрофия', 'Пауэрлифтинг', 'Фитнес', 'ССШ'];
  const found = dirs.find((d) => text.includes(d));
  if (!found) return false;
  const direction = found === 'ССШ' ? 'ССШ (Силачи старой школы)' : found;
  setUser(userId, { stage: STAGES.CHOOSE_PACKAGE, program_direction: direction });

  // Изображение для каждого направления
  const dirImages = {
    'Гипертрофия': 'program_hypertrophy',
    'Пауэрлифтинг': 'program_powerlifting',
    'Фитнес': 'program_fitness',
    'ССШ': 'program_sss',
  };
  const imgName = dirImages[found] || 'programs';

  let msg = `Направление: ${direction}\n\nВыбери пакет:`;
  const descriptions = {
    'Фитнес': texts.programFitnessDescription,
    'Гипертрофия': texts.programHypertrophyDescription,
    'Пауэрлифтинг': texts.programPowerliftingDescription,
    'ССШ': texts.programSSSDescription,
  };
  if (descriptions[found]) {
    msg = descriptions[found] + '\n\n👇 Выбери пакет:';
  }

  await sendImageAndText(ctx, 'screen_images', imgName, msg, packages());
  return true;
}

async function handlePackageChoice(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.CHOOSE_PACKAGE) return false;
  const key = matchPackage(text);
  if (!key) return false;
  const p = PACKAGES[key];
  setUser(userId, { stage: STAGES.PACKAGE_DETAIL, package: p.name, package_price: p.price });
  const imgName = p.image || 'package_starter';
  const msg = (PACKAGE_TEXTS[key] || '') + `\n\n${texts.packageDetail(p.name, p.price)} `;
  await sendImageAndText(ctx, 'screen_images', imgName, msg, packageDetail());
  return true;
}

async function handlePackageDetail(ctx, text) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.PACKAGE_DETAIL) return false;
  if (text.includes('Другие программы')) {
    setUser(userId, { stage: STAGES.CHOOSE_PACKAGE });
    await sendImageAndText(ctx, 'screen_images', 'programs', 'Выбери пакет:', packages());
    return true;
  }
  if (!text.includes('Записаться')) return false;
  const un = ctx.from?.username;
  setUser(userId, { stage: STAGES.PACKAGE_ASK_CONTACT, username: un || '' });
  const username = un ? `@${un} ` : '—';
  const msg = texts.packageAskContact(
    user.package,
    user.package_price,
    user.name,
    user.direction || user.program_direction,
    username
  );
  await ctx.reply(msg, packageAskContact());
  return true;
}

async function handlePackageContact(ctx, text, bot) {
  const userId = ctx.from?.id;
  if (!userId) return false;
  const user = getUser(userId);
  if (user.stage !== STAGES.PACKAGE_ASK_CONTACT) return false;

  if (text.includes('Изменить данные')) {
    setUser(userId, { name: '', phone: '', stage: STAGES.ASK_NAME, awaiting: 'package' });
    await ctx.reply(texts.askName, remove());
    return true;
  }
  if (!text.includes('Оставить заявку')) return false;

  const reg = require('./registration');
  const hasName = user.name && String(user.name).trim();
  const hasPhone = user.phone && String(user.phone).trim();

  // Уведомление о неполной заявке
  if (!hasName || !hasPhone) {
    const b = _bot || bot;
    if (b) {
      await notifyIncompleteApplication(b, ctx, {
        package: user.package || '',
        package_price: user.package_price || '',
        direction: user.direction || user.program_direction || '',
        name: hasName || '',
        phone: hasPhone || '',
      });
    }
  }

  if (!hasName) {
    setUser(userId, { stage: STAGES.ASK_NAME, awaiting: 'package' });
    await ctx.reply(texts.askName, remove());
    return true;
  }
  if (!hasPhone) {
    setUser(userId, { stage: STAGES.ASK_PHONE, awaiting: 'package' });
    await ctx.reply(texts.askPhone, remove());
    return true;
  }

  await reg.sendPackageReport(bot, userId);
  setUser(userId, { stage: STAGES.MENU });
  await sendImageAndText(ctx, 'screen_images', 'package_sent', texts.packageSent, packageSent());
  return true;
}

module.exports = {
  programsStart,
  handleProgramDirection,
  handlePackageChoice,
  handlePackageDetail,
  handlePackageContact,
  setBotInstance,
};
