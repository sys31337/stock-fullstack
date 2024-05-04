import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationFR from './locales/fr.json';
import translationEN from './locales/en.json';

const detectionOptions = {
  order: ['localStorage', 'querystring', 'navigator'],
  lookupQuerystring: 'lng', // if the url contains "?lng=", use that language
  lookupLocalStorage: 'i18nextLng', // if localStorage has a `i18nextLng` entry, use that language

  caches: ['localStorage'],
  excludeCacheFor: ['cimode'],
};

const resources = {
  fr: {
    translation: translationFR,
  },
  en: {
    translation: translationEN,
  },
};

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    useSuspense: true,
    fallbackLng: localStorage.getItem('i18nextLng') || ['fr','en'],
    lng: localStorage.getItem('i18nextLng') || ['fr', 'en'],
    debug: false,
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    detection: detectionOptions,
    react: {
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      useSuspense: true,
    },
  });

export default i18n;
