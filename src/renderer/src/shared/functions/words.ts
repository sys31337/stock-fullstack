export const randomId = () => Math.random().toString(16).slice(8);
export const price = (string: string) => parseFloat(string).toFixed(2);