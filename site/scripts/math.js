export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const mix = (from, to, amount) => from + (to - from) * amount;
export const range = (value, from, to) => clamp((value - from) / (to - from));
export const smoothstep = (value) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};
