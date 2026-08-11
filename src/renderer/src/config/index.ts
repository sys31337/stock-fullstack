import Any from '@web/shared/types/any';

const configOverride = (window as Any).configOverride ?? {};

const isDev = true || configOverride.isDev;

export const assetsBase = import.meta.env.DEV ? '/' : './';

// In host mode this stays http://localhost:4031 (the local Express API).
// In client mode the main process injects the local relay proxy port instead,
// so every existing HTTP call transparently tunnels to the remote host.
const injectedApiUrl = (window as Any).api?.getBaseAppUrl?.();
const baseAppUrl = injectedApiUrl || 'http://localhost:4031';
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
export const defaultWarehouseId = '0a0aaa0a0aa00000aaaaaa0b';
