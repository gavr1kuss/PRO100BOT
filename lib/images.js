const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMAGE_FORMATS = ['.png', '.jpg', '.jpeg'];
const GIF_FORMAT = '.gif';

/**
 * Найти путь к медиафайлу в папке. Проверяет name + .gif, .png, .jpg, .jpeg.
 * Приоритет: GIF > PNG > JPG > JPEG
 * @param {string} folder - имя папки (flow_images, screen_images, guide_images_men, guide_images_women)
 * @param {string} name - имя без расширения (trial_intro, menu, guide_1)
 * @returns {{path: string, type: 'gif'|'image'}|null}
 */
function getMediaPath(folder, name) {
  const dir = path.join(ROOT, folder);
  if (!fs.existsSync(dir)) return null;

  // Сначала проверяем GIF
  const gifPath = path.join(dir, name + GIF_FORMAT);
  if (fs.existsSync(gifPath)) {
    return { path: gifPath, type: 'gif' };
  }

  // Затем изображения
  for (const ext of IMAGE_FORMATS) {
    const p = path.join(dir, name + ext);
    if (fs.existsSync(p)) {
      return { path: p, type: 'image' };
    }
  }
  return null;
}

/**
 * Обратная совместимость - возвращает только путь
 */
function getImagePath(folder, name) {
  const media = getMediaPath(folder, name);
  return media ? media.path : null;
}

/**
 * Отправить картинку или GIF (если есть), затем текст с клавиатурой.
 * @param {object} ctx - Telegraf context
 * @param {string} folder
 * @param {string} name
 * @param {string} text
 * @param {object} [keyboard] - Markup.keyboard(...) или Markup.inlineKeyboard(...)
 */
async function sendImageAndText(ctx, folder, name, text, keyboard) {
  const media = getMediaPath(folder, name);
  const extra = keyboard ? { reply_markup: keyboard.reply_markup } : {};

  if (media) {
    try {
      const options = { caption: text, ...extra };
      if (media.type === 'gif') {
        await ctx.replyWithAnimation({ source: media.path }, options);
      } else {
        await ctx.replyWithPhoto({ source: media.path }, options);
      }
      return;
    } catch (e) {
      console.error('Media send error:', e.message);
    }
  }
  // Fallback if no media or error
  await ctx.reply(text, extra);
}

module.exports = { getImagePath, getMediaPath, sendImageAndText };
