const { log, error: logError } = console;

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);

const parseJwt = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

export {
  log, logError, randomInt, parseJwt,
};
