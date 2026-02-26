/**
 * Этапы (stages) User Flow
 */
module.exports = {
  // Испытания: вступление → направление → квиз 5 → финал
  TRIAL_INTRO: 'trial_intro',
  TRIAL_DIRECTION: 'trial_direction',
  TRIAL_QUIZ_1: 'trial_quiz_1',   // уровень
  TRIAL_QUIZ_2: 'trial_quiz_2',   // травмы
  TRIAL_QUIZ_3: 'trial_quiz_3',   // оборудование
  TRIAL_QUIZ_4: 'trial_quiz_4',   // дни
  TRIAL_QUIZ_5: 'trial_quiz_5',   // цель
  TRIAL_FINAL: 'trial_final',

  // Подарок: гайд М/Ж
  CHOOSE_GUIDE_TYPE: 'choose_guide_type',
  GUIDE_GALLERY: 'guide_gallery',

  // Главное меню и разделы
  MENU: 'menu',
  PROGRAMS: 'programs',
  CHOOSE_PACKAGE: 'choose_package',      // выбор пакета (STARTER, ONLINE CREW, ...)
  PACKAGE_DETAIL: 'package_detail',
  PACKAGE_ASK_CONTACT: 'package_ask_contact',
  REFERRAL: 'referral',
  GIFTS: 'gifts',
  GIFTS_CHECK_SUB: 'gifts_check_sub',
  GIFT_TRIAL_ONLINE: 'gift_trial_online',
  GIFT_TRIAL_OFFLINE: 'gift_trial_offline',
  GIFT_PROGRAM: 'gift_program',
  GIFT_NUTRITION: 'gift_nutrition',
  MATERIALS: 'materials',
  CONTACT: 'contact',

  // Регистрация (имя, телефон)
  ASK_NAME: 'ask_name',
  ASK_PHONE: 'ask_phone',
};
