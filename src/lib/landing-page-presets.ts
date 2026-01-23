export type LandingPagePreset = {
  id: number;
  name: string;
  primary: string; // HSL values as "h s% l%"
  secondary: string;
  accent: string;
};

/**
 * Parse HSL string to extract hue, saturation, and lightness
 */
function parseHsl(hsl: string): { h: number; s: number; l: number } {
  const parts = hsl.trim().split(/\s+/);
  const h = parseInt(parts[0], 10);
  const s = parseInt(parts[1].replace("%", ""), 10);
  const l = parseInt(parts[2].replace("%", ""), 10);
  return { h, s, l };
}

/**
 * NOTE: All presets are now stored in landing-page-presets-custom.json
 * and managed through the admin panel. This file only contains types and utilities.
 */

/**
 * Convert HSL string to HSL CSS value
 */
export function hslToCss(hsl: string): string {
  return `hsl(${hsl})`;
}

/**
 * Generate CSS variables for a single preset
 * Can be used on both client and server
 */
export function generatePresetCSS(preset: LandingPagePreset): string {
  const primaryHsl = parseHsl(preset.primary);
  const secondaryHsl = parseHsl(preset.secondary);
  const accentHsl = parseHsl(preset.accent);

  // Extract hue from primary for background/foreground tints
  const primaryHue = primaryHsl.h;

  // Generate glow colors (slightly brighter)
  const primaryGlow = `${primaryHue} ${Math.min(primaryHsl.s + 5, 100)}% ${Math.min(primaryHsl.l + 7, 100)}%`;
  const secondaryGlow = `${parseHsl(preset.secondary).h} ${Math.min(secondaryHsl.s + 5, 100)}% ${Math.min(secondaryHsl.l + 7, 100)}%`;
  const accentGlow = `${parseHsl(preset.accent).h} ${Math.min(accentHsl.s + 5, 100)}% ${Math.min(accentHsl.l + 7, 100)}%`;

  // Light mode CSS
  const lightModeCSS = `
.preset-landing-page-${preset.id},
body.preset-landing-page-${preset.id} {
  --background: ${primaryHue} 40% 98%;
  --foreground: ${primaryHue} 15% 15%;
  --card: 0 0% 100%;
  --card-foreground: ${primaryHue} 15% 15%;
  --popover: 0 0% 100%;
  --popover-foreground: ${primaryHue} 15% 15%;
  --primary: ${preset.primary};
  --primary-foreground: 0 0% 100%;
  --primary-glow: ${primaryGlow};
  --secondary: ${preset.secondary};
  --secondary-foreground: 0 0% 100%;
  --secondary-glow: ${secondaryGlow};
  --accent: ${preset.accent};
  --accent-foreground: 0 0% 100%;
  --accent-glow: ${accentGlow};
  --muted: ${primaryHue} 30% 95%;
  --muted-foreground: ${primaryHue} 10% 45%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 100%;
  --border: ${primaryHue} 25% 90%;
  --input: ${primaryHue} 25% 90%;
  --ring: ${preset.primary};
  --radius: 1rem;
  --gradient-start: ${preset.primary};
  --gradient-mid: ${preset.secondary};
  --gradient-end: ${preset.accent};
  --glow-soft: 0 0 40px hsl(var(--primary-glow) / 0.3);
  --glow-medium: 0 0 60px hsl(var(--primary-glow) / 0.4);
  --glow-strong: 0 0 80px hsl(var(--accent-glow) / 0.5);
  --shadow-card: 0 4px 24px hsl(var(--primary) / 0.08);
  --shadow-card-hover: 0 8px 32px hsl(var(--primary) / 0.15);
}`;

  // Dark mode CSS
  const darkModeCSS = `
.dark .preset-landing-page-${preset.id},
.dark body.preset-landing-page-${preset.id} {
  --background: ${primaryHue} 15% 8%;
  --foreground: ${primaryHue} 15% 95%;
  --card: ${primaryHue} 15% 10%;
  --card-foreground: ${primaryHue} 15% 95%;
  --popover: ${primaryHue} 15% 10%;
  --popover-foreground: ${primaryHue} 15% 95%;
  --primary: ${preset.primary};
  --primary-foreground: 0 0% 100%;
  --secondary: ${preset.secondary};
  --secondary-foreground: 0 0% 100%;
  --accent: ${preset.accent};
  --accent-foreground: 0 0% 100%;
  --muted: ${primaryHue} 15% 15%;
  --muted-foreground: ${primaryHue} 10% 65%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: ${primaryHue} 15% 95%;
  --border: ${primaryHue} 15% 20%;
  --input: ${primaryHue} 15% 20%;
  --ring: ${preset.primary};
}`;

  return lightModeCSS + darkModeCSS;
}
