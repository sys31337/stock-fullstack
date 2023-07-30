import Any from '@shared/types/any';

const configOverride = (window as Any).configOverride ?? {};

const isDev = true || configOverride.isDev;

const baseAppUrl = import.meta.env.VITE_API_URL;
const appUrl = import.meta.env.VITE_FRONTEND_URL;

export const googleInfo = {
  clientId: '1017069831517-dd9vl7rrhrm8b73b471sgqple905m0tk.apps.googleusercontent.com',
};

export const config = {
  baseAppUrl,
  appUrl,
  defaultAppLang: 'fr',
  supportedLanguages: ['fr'],
  baseUrl: import.meta.env.BASE_URL,
  isDev,
  ...configOverride,
};
