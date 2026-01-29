/**
 * Color utility functions for deriving light/dark/shadow colors from a base HSL color
 * 
 * The design system uses 3 derived colors from 1 user-selected "bright" color:
 * 1. Light/Muted - used for backgrounds (quiz option bg, feedback area bg)
 * 2. Bright/Primary - the main color user picks (button color, text color, borders)
 * 3. Shadow/Darker - used for 3D button shadows
 */

export interface DerivedColors {
  light: string;    // HSL for light background (e.g., "0 42% 93%")
  bright: string;   // Original HSL color (e.g., "0 84% 60%")
  shadow: string;   // HSL for shadow (e.g., "0 84% 35%")
  darkText: string; // HSL for dark text on light bg (e.g., "0 60% 30%")
}

/**
 * Parse HSL string into components
 * Supports formats: "220 70% 50%", "220 70 50", "220, 70%, 50%"
 */
export function parseHSL(hsl: string): { h: number; s: number; l: number } | null {
  if (!hsl) return null;
  
  // Remove % signs and split by space or comma
  const cleaned = hsl.replace(/%/g, '').replace(/,/g, ' ');
  const parts = cleaned.split(/\s+/).filter(Boolean);
  
  if (parts.length >= 3) {
    return {
      h: parseFloat(parts[0]),
      s: parseFloat(parts[1]),
      l: parseFloat(parts[2]),
    };
  }
  
  return null;
}

/**
 * Format HSL components back to string
 */
export function formatHSL(h: number, s: number, l: number): string {
  return `${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%`;
}

/**
 * Derive all color variants from a single bright color
 * 
 * @param brightColor - The main HSL color (e.g., "0 84% 60%")
 * @returns Object with light, bright, shadow, and darkText colors
 */
export function deriveColors(brightColor: string): DerivedColors {
  const parsed = parseHSL(brightColor);
  
  if (!parsed) {
    // Fallback for invalid input - return defaults based on red
    return {
      light: '0 42% 93%',
      bright: brightColor || '0 84% 60%',
      shadow: '0 70% 35%',
      darkText: '0 60% 30%',
    };
  }
  
  const { h, s, l } = parsed;
  
  // Light/Muted: Keep hue, reduce saturation to ~50%, set lightness to ~93%
  const lightS = Math.round(s * 0.5);
  const lightL = 93;
  
  // Shadow: Keep hue, slightly reduce saturation, darken significantly
  const shadowS = Math.round(s * 0.85);
  const shadowL = Math.max(l - 25, 20); // At least 20% lightness
  
  // Dark text: Keep hue, moderate saturation, dark lightness for readability
  const darkTextS = Math.min(s * 0.7, 70);
  const darkTextL = 30;
  
  return {
    light: formatHSL(h, lightS, lightL),
    bright: brightColor,
    shadow: formatHSL(h, shadowS, shadowL),
    darkText: formatHSL(h, darkTextS, darkTextL),
  };
}

/**
 * Get soft pastel background color from an HSL color
 * Used for feedback areas and quiz option backgrounds
 */
export function getSoftBackgroundColor(hslColor: string, lightness: number = 93): string {
  const parsed = parseHSL(hslColor);
  if (!parsed) return `hsl(${hslColor} / 0.15)`;
  
  const { h, s } = parsed;
  const softS = Math.round(s * 0.5); // Reduce saturation for softer look
  return `hsl(${h} ${softS}% ${lightness}%)`;
}

/**
 * Get dark text color variant for readability on light backgrounds
 */
export function getDarkTextColor(hslColor: string): string {
  const parsed = parseHSL(hslColor);
  if (!parsed) return `hsl(${hslColor})`;
  
  const { h } = parsed;
  return `hsl(${h} 60% 30%)`; // Dark version with same hue
}

/**
 * Get shadow color for 3D raised buttons
 * Returns an HSL string suitable for box-shadow
 */
export function getButtonShadowColor(hslColor: string): string {
  const parsed = parseHSL(hslColor);
  if (!parsed) return hslColor;
  
  const { h, s, l } = parsed;
  const shadowS = Math.round(s * 0.85);
  const shadowL = Math.max(l - 25, 20);
  return formatHSL(h, shadowS, shadowL);
}

/**
 * Generate box-shadow for raised button using derived shadow color
 */
export function getRaisedButtonShadow(baseColor: string): React.CSSProperties {
  const shadowColor = getButtonShadowColor(baseColor);
  return {
    boxShadow: `0 4px 0 0 hsl(${shadowColor}), 0 6px 12px -2px hsl(${baseColor} / 0.25)`,
  };
}
