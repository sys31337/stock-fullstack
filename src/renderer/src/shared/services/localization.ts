import { initReactI18next } from 'react-i18next';

import { config } from '@config';
import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';

import cacheService from '@shared/services/cache';

const userLang = cacheService.get<string>('USER_LANG_KEY');

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: userLang || config.defaultAppLang,
    fallbackLng: undefined,
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: async (langs, namespaces) => {
        const urls = await import.meta.glob('/src/assets/locales/*/*.json', {
          as: 'url',
          eager: true,
        });

        return urls[`/src/assets/locales/${langs[0]}/${namespaces}.json`];
      },
    },
  });
