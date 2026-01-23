import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { LandingPagePreset } from "./landing-page-presets";
import { generatePresetCSS } from "./landing-page-presets";

/**
 * Read all presets from JSON file (server-only)
 * All presets are stored in the JSON file and managed through the admin panel.
 * This function reads all presets (previously "custom" presets, now all presets).
 */
export function readCustomPresets(): LandingPagePreset[] {
  try {
    const filePath = join(process.cwd(), "src/lib/landing-page-presets-custom.json");
    const fileContent = readFileSync(filePath, "utf-8");
    return JSON.parse(fileContent) as LandingPagePreset[];
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Write all presets to JSON file (server-only)
 * All presets are stored in this file and managed through the admin panel.
 */
export function writeCustomPresets(presets: LandingPagePreset[]): void {
  const filePath = join(process.cwd(), "src/lib/landing-page-presets-custom.json");
  writeFileSync(filePath, JSON.stringify(presets, null, 2), "utf-8");
}

/**
 * Get the next available preset ID
 * Finds the maximum ID and returns the next one
 * Used when creating new presets through the admin panel
 */
export function getNextCustomPresetId(presets: LandingPagePreset[]): number {
  if (presets.length === 0) return 1;
  const maxId = Math.max(...presets.map((p) => p.id));
  return maxId + 1;
}

/**
 * Get all presets from JSON file - server-only
 */
export function getAllPresets(): LandingPagePreset[] {
  return readCustomPresets();
}

/**
 * Get a preset by ID (checks both hardcoded and custom) - server-only
 */
export function getPresetById(id: number): LandingPagePreset | undefined {
  const allPresets = getAllPresets();
  return allPresets.find((preset) => preset.id === id);
}

/**
 * Generate CSS for all presets (server-only)
 * Generates CSS for all presets stored in the JSON file.
 */
export function generateAllCustomPresetsCSS(): string {
  const presets = readCustomPresets();
  if (presets.length === 0) return "";

  return presets.map((preset) => generatePresetCSS(preset)).join("\n");
}

/**
 * Migrate a preset number to a full preset object (for backward compatibility)
 * Used during migration and runtime compatibility
 */
export function migratePresetNumberToObject(presetId: number): LandingPagePreset | null {
  const preset = getPresetById(presetId);
  return preset || null;
}
