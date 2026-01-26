/**
 * Waveform configuration constants and utilities
 */

export const WAVEFORM_CONFIG = {
  barWidth: 3,
  barRadius: 3,
  height: 60,
  barGap: 2,
  sampleRate: 8000,
  cursorWidth: 2,
  peaksLength: 1024,
  normalize: true,
  interact: false, // Disable built-in interaction - we'll handle clicks manually
} as const;

export type WaveformColors = {
  waveColor: string;
  progressColor: string;
  cursorColor: string;
};

/**
 * Get waveform colors based on theme
 * @param theme - Current theme from next-themes
 * @param resolvedTheme - Resolved theme (handles system theme)
 * @returns Object with waveColor, progressColor, and cursorColor
 */
export function getWaveformColors(
  theme: string | undefined,
  resolvedTheme: string | undefined
): WaveformColors {
  // Determine if dark mode is active
  // Use resolvedTheme if available (handles system theme), otherwise check theme directly
  const isDark =
    resolvedTheme === "dark" ||
    (resolvedTheme === undefined && theme === "dark") ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Set colors based on theme
  // In dark mode: use bright light color for visibility on dark background
  // In light mode: use darker color for visibility on light background
  const waveColor = isDark
    ? "#ffffff" // Pure white in dark mode for maximum visibility
    : "hsl(var(--muted-foreground) / 0.8)"; // Darker color in light mode

  // Progress color - the part that shows where music has already played
  // Get the computed primary color value from document root to ensure it's applied correctly
  let progressColor = "hsl(var(--primary))";
  let cursorColor = "hsl(var(--primary))";

  // Try to get the actual computed primary color value
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const primaryValue = rootStyle.getPropertyValue("--primary").trim();
      if (primaryValue) {
        // Use the actual HSL value
        progressColor = `hsl(${primaryValue})`;
        cursorColor = `hsl(${primaryValue})`;
      }
    } catch (e) {
      // Could not get computed primary color
    }
  }

  return {
    waveColor,
    progressColor,
    cursorColor,
  };
}
