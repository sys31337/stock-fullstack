/* eslint-disable */
const log = (message?: string, ...params: unknown[]): void => console.log(message, ...params);
const logError = (message?: string, ...error: unknown[]): void => console.error(message, ...error);
/* eslint-enable */

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const parseJwt = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

export {
  log, logError, randomInt, parseJwt,
};
