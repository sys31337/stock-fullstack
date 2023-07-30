import Any from '@shared/types/any';

const configOverride = (window as Any).configOverride ?? {};

const isDev = true || configOverride.isDev;

const baseAppUrl = import.meta.env.VITE_API_URL;
const appUrl = import.meta.env.VITE_FRONTEND_URL;

console.log(baseAppUrl)

export const config = {
  baseAppUrl,
  appUrl,
  defaultAppLang: 'en',
  supportedLanguages: ['en'],
  baseUrl: import.meta.env.BASE_URL,
  isDev,
  ...configOverride,
};
