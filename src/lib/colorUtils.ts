/**
 * Pure color conversion utilities
 * Framework-agnostic color math functions for RGB, Hex, and HSL conversions
 */

/**
 * Convert RGB values to hex color
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Hex color string (e.g., "#FF5733")
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`.toUpperCase();
}

/**
 * Convert hex color to RGB values
 * @param hex - Hex color string (with or without #)
 * @returns Object with r, g, b values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove # if present
  hex = hex.replace("#", "");

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return { r, g, b };
}

/**
 * Convert hex color to HSL values
 * @param hex - Hex color string (with or without #)
 * @returns Object with h (0-360), s (0-100), l (0-100)
 */
export function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace("#", "");

  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert RGB values to HSL
 * @param r - Red value (0-255)
 * @param g - Green value (0-255)
 * @param b - Blue value (0-255)
 * @returns Object with h (0-360), s (0-100), l (0-100)
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL values to hex color
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Hex color string (e.g., "#FF5733")
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

/**
 * Convert HSL values to RGB
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns Object with r, g, b values (0-255)
 */
export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color);
  };
  return {
    r: f(0),
    g: f(8),
    b: f(4),
  };
}

/**
 * Check if a color is too light (close to white)
 * Uses luminance calculation to determine brightness
 * @param hexColor - Hex color string (with or without #)
 * @returns true if the color is light (luminance > 0.8)
 */
export function isLightColor(hexColor: string): boolean {
  const { r, g, b } = hexToRgb(hexColor);

  // Calculate luminance using the relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.8;
}

/**
 * Check if a color is too dark
 * @param hexColor - Hex color string (with or without #)
 * @returns true if the color is dark (luminance < 0.2)
 */
export function isDarkColor(hexColor: string): boolean {
  const { r, g, b } = hexToRgb(hexColor);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.2;
}

/**
 * Calculate relative luminance of a color (WCAG standard)
 * @param hexColor - Hex color string (with or without #)
 * @returns Luminance value (0-1)
 */
export function getLuminance(hexColor: string): number {
  const { r, g, b } = hexToRgb(hexColor);

  const [rs, gs, bs] = [r, g, b].map((c) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors (WCAG standard)
 * @param color1 - First hex color
 * @param color2 - Second hex color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}
