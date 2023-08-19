export const capitalize = (str: string) => str.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());

export const textCutter = (text: string, n: number) => {
  const short = text.substr(0, n);
  if (/^\S/.test(text.substr(n))) { return short.replace(/\s+\S*$/, ''); }
  return short;
};

export const uuid = (length: number) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

export const randomNumber = (length: number) => {
  let result = '';
  const characters = '0123456789';
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * 10));
    counter += 1;
  }
  return result;
};
