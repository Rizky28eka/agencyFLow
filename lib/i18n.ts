import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import Backend from 'i18next-http-backend'; // To load translations from public/locales

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'id', // Default language
    debug: false, // Set to true for debugging
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to your translation files
    },
    react: {
      useSuspense: false, // Set to true if you want to use React.Suspense
    },
    ns: ['common'], // Default namespace
    defaultNS: 'common',
    supportedLngs: ['en', 'id'], // Supported languages
  });

export const supportedLngs = ['en', 'id'];

export default i18n;
