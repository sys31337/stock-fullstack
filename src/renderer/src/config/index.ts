import Any from '@shared/types/any';

const configOverride = (window as Any).configOverride ?? {};

const isDev = true || configOverride.isDev;

const baseAppUrl = 'http://localhost:4031';
const appUrl = 'http://localhost:5174';
export const config = {
  baseAppUrl,
  appUrl,
  defaultAppLang: 'en',
  supportedLanguages: ['en'],
  baseUrl: 'http://localhost:5174',
  isDev,
  ...configOverride,
};
export const defaultId = '0a0aaa0a0aa00000aaaaaa0a';
