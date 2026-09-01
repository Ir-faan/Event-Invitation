const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function createRandomId(length: number) {
  const maximumUnbiasedValue = Math.floor(256 / BASE58.length) * BASE58.length;
  let result = "";
  while (result.length < length) {
    const values = new Uint8Array(length - result.length + 4);
    crypto.getRandomValues(values);
    for (const value of values) {
      if (value < maximumUnbiasedValue) result += BASE58[value % BASE58.length];
      if (result.length === length) break;
    }
  }
  return result;
}
