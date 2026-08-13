export const randomId = () => Math.random().toString(16).slice(8);
export const price = (string: string | number) => parseFloat(`${string}`).toFixed(2);

/**
 * Money with thousands separator and two decimals, e.g. 1234567.5 -> "1,234,567.50".
 */
export const money = (value: string | number): string => {
  const n = Number(value);
  if (Number.isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const units = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

const convertBelowMillion = (n: number): string => {
  if (n === 0) return '';
  if (n < 20) return units[n];
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return tens[t];
    if (u === 1) return `${tens[t]} et un`;
    return `${tens[t]}-${units[u]}`;
  }
  if (n < 80) {
    const u = n - 60;
    if (u === 11) return 'soixante et onze';
    return `soixante-${units[u]}`;
  }
  if (n < 90) {
    const u = n - 80;
    if (u === 0) return 'quatre-vingts';
    if (u === 1) return 'quatre-vingt-un';
    return `quatre-vingt-${units[u]}`;
  }
  if (n < 100) {
    const u = n - 80;
    if (u === 11) return 'quatre-vingt-onze';
    return `quatre-vingt-${units[u]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    const hStr = h === 1 ? 'cent' : `${units[h]} cent`;
    const rStr = r === 0 ? '' : ` ${convertBelowMillion(r)}`;
    if (r === 0 && h > 1) return `${hStr}s`;
    return hStr + rStr;
  }
  if (n < 1000000) {
    const m = Math.floor(n / 1000);
    const r = n % 1000;
    const mStr = m === 1 ? 'mille' : `${convertBelowMillion(m)} mille`;
    const rStr = r === 0 ? '' : ` ${convertBelowMillion(r)}`;
    return mStr + rStr;
  }
  return '';
};

export const asLetters = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (n === 0) return 'zéro';
  const integerPart = Math.floor(Math.abs(n));
  const decimalPart = Math.round((Math.abs(n) - integerPart) * 100);
  const sign = n < 0 ? 'moins ' : '';
  let result = sign;
  if (integerPart >= 1000000) {
    const mil = Math.floor(integerPart / 1000000);
    const r = integerPart % 1000000;
    result += mil === 1 ? 'un million' : `${convertBelowMillion(mil)} millions`;
    if (r > 0) result += ` ${convertBelowMillion(r)}`;
  } else {
    result += convertBelowMillion(integerPart);
  }
  if (decimalPart > 0) {
    const decStr = decimalPart === 1 ? 'un' : convertBelowMillion(decimalPart);
    result += ` virgule ${decStr}`;
  }
  return result.charAt(0).toUpperCase() + result.slice(1);
};