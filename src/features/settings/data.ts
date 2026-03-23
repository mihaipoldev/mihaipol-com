import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { LandingPagePreset } from "@/lib/landing-page-presets";
import { getPresetById } from "@/lib/landing-page-presets-server";

export async function getSitePreference(key: string): Promise<any> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("site_preferences")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Error fetching site preference:", error);
      return null;
    }

    return data?.value ?? null;
  } catch (error) {
    console.error("Error fetching site preference:", error);
    return null;
  }
}

/**
 * Get a site preference as a number with fallback to default
 */
export async function getSitePreferenceNumber(key: string, defaultValue: number): Promise<number> {
  const value = await getSitePreference(key);
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const num = typeof value === "number" ? value : Number(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Get a site preference as a boolean with fallback to default
 */
export async function getSitePreferenceBoolean(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  const value = await getSitePreference(key);
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return defaultValue;
}

/**
 * Get a site preference as a string with fallback to default
 */
export async function getSitePreferenceString(
  key: string,
  defaultValue: string | null = null
): Promise<string | null> {
  const value = await getSitePreference(key);
  if (value === null || value === undefined) {
    return defaultValue;
  }
  if (typeof value === "string") {
    return value.trim() === "" ? defaultValue : value;
  }
  // Handle JSON null
  if (value === "null" || (typeof value === "object" && value === null)) {
    return defaultValue;
  }
  return String(value);
}

/**
 * Get all homepage-related site preferences in a single query
 * Returns an object with all homepage preferences
 */
export async function getHomepageSitePreferences(): Promise<{
  events_show_past_strikethrough: boolean;
  albums_homepage_columns: number;
  updates_homepage_columns: number;
  featured_album_id: string | null;
  griffith_albums_homepage_columns: number;
}> {
  try {
    const keys = [
      "events_show_past_strikethrough",
      "albums_homepage_columns",
      "updates_homepage_columns",
      "featured_album_id",
      "griffith_albums_homepage_columns",
    ];

    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("site_preferences")
      .select("key, value")
      .in("key", keys);

    if (error) {
      console.error("Error fetching homepage site preferences:", error);
      return {
        events_show_past_strikethrough: true,
        albums_homepage_columns: 3,
        updates_homepage_columns: 3,
        featured_album_id: null,
        griffith_albums_homepage_columns: 3,
      };
    }

    const preferencesMap = new Map<string, any>();
    if (data) {
      for (const pref of data) {
        preferencesMap.set(pref.key, pref.value);
      }
    }

    const getValue = <T>(key: string, defaultValue: T, converter?: (val: any) => T): T => {
      const value = preferencesMap.get(key);
      if (value === null || value === undefined) return defaultValue;
      if (converter) return converter(value);
      return value as T;
    };

    const boolConverter = (val: any): boolean => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true";
      return false;
    };

    const numConverter = (val: any): number => {
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) ? 0 : num;
    };

    const stringConverter = (val: any): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") return val.trim() === "" ? null : val;
      if (val === "null" || (typeof val === "object" && val === null)) return null;
      return String(val);
    };

    return {
      events_show_past_strikethrough: getValue("events_show_past_strikethrough", true, boolConverter),
      albums_homepage_columns: getValue("albums_homepage_columns", 3, numConverter),
      updates_homepage_columns: getValue("updates_homepage_columns", 3, numConverter),
      featured_album_id: getValue("featured_album_id", null, stringConverter),
      griffith_albums_homepage_columns: getValue("griffith_albums_homepage_columns", 3, numConverter),
    };
  } catch (error) {
    console.error("Error fetching homepage site preferences:", error);
    return {
      events_show_past_strikethrough: true,
      albums_homepage_columns: 3,
      updates_homepage_columns: 3,
      featured_album_id: null,
      griffith_albums_homepage_columns: 3,
    };
  }
}

/**
 * Get a site preference as a landing page preset object
 * Handles both number (backward compat) and object formats
 * Falls back to default preset if invalid
 */
export async function getSitePreferencePreset(
  key: string,
  defaultValue: LandingPagePreset
): Promise<LandingPagePreset> {
  const value = await getSitePreference(key);
  
  if (value === null || value === undefined) {
    return defaultValue;
  }

  // If it's already a preset object, validate and return it
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const presetValue = value as any;
    // Normalize ID - Supabase JSONB might store numbers as strings
    const normalizedId = typeof presetValue.id === "string" ? parseInt(presetValue.id, 10) : presetValue.id;
    
    // Validate it has required fields
    if (
      typeof normalizedId === "number" &&
      !isNaN(normalizedId) &&
      typeof presetValue.name === "string" &&
      typeof presetValue.primary === "string" &&
      typeof presetValue.secondary === "string" &&
      typeof presetValue.accent === "string"
    ) {
      return {
        id: normalizedId,
        name: presetValue.name,
        primary: presetValue.primary,
        secondary: presetValue.secondary,
        accent: presetValue.accent,
      };
    }
  }

  // If it's a number (backward compatibility), look up the preset
  if (typeof value === "number") {
    const preset = getPresetById(value);
    if (preset) {
      return preset;
    }
  }

  // If it's a string that can be parsed as a number
  if (typeof value === "string") {
    const num = Number(value);
    if (!isNaN(num)) {
      const preset = getPresetById(num);
      if (preset) {
        return preset;
      }
    }
  }

  // Fall back to default
  return defaultValue;
}
