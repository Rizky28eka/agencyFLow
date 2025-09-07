/** @type {import('next-i18next').UserConfig} */
const i18nConfig = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id'],
  },
};

module.exports = i18nConfig;

module.exports.getOptions = (lng = i18nConfig.i18n.defaultLocale, ns = 'common') => {
  return {
    supportedLngs: i18nConfig.i18n.locales,
    fallbackLng: i18nConfig.i18n.defaultLocale,
    lng,
    ns,
  };
};