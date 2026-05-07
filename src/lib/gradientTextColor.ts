/**
 * Auto-pick a readable title color for a gradient background.
 * Algorithm:
 *  1. Extract two HEX colors from the gradient string.
 *  2. Convert to RGB and compute average + per-color brightness.
 *  3. If contrast between the two stops is strong (|Δbrightness| > 110),
 *     return a fixed contrast color (#FFFFFF or #111111).
 *  4. Otherwise, shift the average by ±100 per channel away from the
 *     dominant tone (lighter for dark bg, darker for light bg).
 */

const FALLBACK = '#1f1f1f';

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const m = hex.trim().match(/^#?([a-fA-F0-9]{6})$/);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((c) => clamp(c).toString(16).padStart(2, '0')).join('');

const brightness = (r: number, g: number, b: number) =>
  0.299 * r + 0.587 * g + 0.114 * b;

export function getAutoTitleColor(gradient: string | null | undefined): string {
  if (!gradient) return FALLBACK;
  const hexes = gradient.match(/#[0-9a-fA-F]{6}/g);
  if (!hexes || hexes.length === 0) return FALLBACK;

  const c1 = hexToRgb(hexes[0]);
  const c2 = hexToRgb(hexes[1] ?? hexes[0]);
  if (!c1 || !c2) return FALLBACK;

  const avgR = (c1.r + c2.r) / 2;
  const avgG = (c1.g + c2.g) / 2;
  const avgB = (c1.b + c2.b) / 2;

  const b1 = brightness(c1.r, c1.g, c1.b);
  const b2 = brightness(c2.r, c2.g, c2.b);
  const avgBrightness = brightness(avgR, avgG, avgB);
  const isDark = avgBrightness < 128;

  // Strong contrast → fixed color
  if (Math.abs(b1 - b2) > 110) {
    return isDark ? '#FFFFFF' : '#111111';
  }

  const shift = isDark ? 100 : -100;
  return rgbToHex(avgR + shift, avgG + shift, avgB + shift);
}
