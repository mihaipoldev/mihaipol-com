import { supabase } from "@/lib/supabase";
import type { UserSettings, UserColor, SitePreference } from "./types";
import type { LandingPagePreset } from "@/lib/landing-page-presets";
import { getPresetById } from "@/lib/landing-page-presets-server";

/**
 * Fetch user settings record
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user settings:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return null;
  }
}

/**
 * Fetch style_color specifically
 */
export async function fetchStyleColor(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("user_settings")
      .select("style_color")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching style color:", error);
      return null;
    }

    return data?.style_color || null;
  } catch (error) {
    console.error("Error fetching style color:", error);
    return null;
  }
}

/**
 * Fetch all user colors
 */
export async function fetchUserColors(userId: string): Promise<UserColor[]> {
  try {
    const { data, error } = await supabase
      .from("user_colors")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user colors:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching user colors:", error);
    return [];
  }
}

/**
 * Fetch a single user color by ID
 */
export async function fetchUserColor(userId: string, colorId: string): Promise<UserColor | null> {
  try {
    const { data, error } = await supabase
      .from("user_colors")
      .select("*")
      .eq("user_id", userId)
      .eq("id", colorId)
      .maybeSingle();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Color not found
      }
      console.error("Error fetching user color:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching user color:", error);
    return null;
  }
}

/**
 * Get a single site preference by key
 */
export async function getSitePreference(key: string): Promise<any> {
  try {
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
 * Get all site preferences
 */
export async function getAllSitePreferences(): Promise<SitePreference[]> {
  try {
    const { data, error } = await supabase
      .from("site_preferences")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      console.error("Error fetching all site preferences:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching all site preferences:", error);
    return [];
  }
}

/**
 * Get site preferences by category
 */
export async function getSitePreferencesByCategory(
  category: "events" | "albums" | "updates" | "general" | "griffith" | "feature" | "integrations"
): Promise<SitePreference[]> {
  try {
    const { data, error } = await supabase
      .from("site_preferences")
      .select("*")
      .eq("category", category)
      .order("key", { ascending: true });

    if (error) {
      console.error("Error fetching site preferences by category:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching site preferences by category:", error);
    return [];
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
  events_section_show: boolean;
  albums_section_show: boolean;
  griffith_section_show: boolean;
  feature_section_show: boolean;
  updates_section_show: boolean;
  events_section_order: number;
  albums_section_order: number;
  griffith_section_order: number;
  feature_section_order: number;
  updates_section_order: number;
}> {
  try {
    const keys = [
      "events_show_past_strikethrough",
      "albums_homepage_columns",
      "updates_homepage_columns",
      "featured_album_id",
      "griffith_albums_homepage_columns",
      "events_section_show",
      "albums_section_show",
      "griffith_section_show",
      "feature_section_show",
      "updates_section_show",
      "events_section_order",
      "albums_section_order",
      "griffith_section_order",
      "feature_section_order",
      "updates_section_order",
    ];

    const { data, error } = await supabase
      .from("site_preferences")
      .select("key, value")
      .in("key", keys);

    if (error) {
      console.error("Error fetching homepage site preferences:", error);
      // Return defaults on error
      return {
        events_show_past_strikethrough: true,
        albums_homepage_columns: 3,
        updates_homepage_columns: 3,
        featured_album_id: null,
        griffith_albums_homepage_columns: 3,
        events_section_show: true,
        albums_section_show: true,
        griffith_section_show: true,
        feature_section_show: true,
        updates_section_show: true,
        events_section_order: 1,
        albums_section_order: 2,
        griffith_section_order: 3,
        feature_section_order: 4,
        updates_section_order: 5,
      };
    }

    // Create a map for quick lookup
    const preferencesMap = new Map<string, any>();
    if (data) {
      for (const pref of data) {
        preferencesMap.set(pref.key, pref.value);
      }
    }

    // Helper function to get value with type conversion and default
    const getValue = <T>(
      key: string,
      defaultValue: T,
      converter?: (val: any) => T
    ): T => {
      const value = preferencesMap.get(key);
      if (value === null || value === undefined) {
        return defaultValue;
      }
      if (converter) {
        return converter(value);
      }
      return value as T;
    };

    // Convert boolean strings to booleans
    const boolConverter = (val: any): boolean => {
      if (typeof val === "boolean") return val;
      if (typeof val === "string") return val.toLowerCase() === "true";
      return false;
    };

    // Convert to number
    const numConverter = (val: any): number => {
      const num = typeof val === "number" ? val : Number(val);
      return isNaN(num) ? 0 : num;
    };

    // Convert string, handling empty strings and null
    const stringConverter = (val: any): string | null => {
      if (val === null || val === undefined) return null;
      if (typeof val === "string") {
        return val.trim() === "" ? null : val;
      }
      if (val === "null" || (typeof val === "object" && val === null)) {
        return null;
      }
      return String(val);
    };

    return {
      events_show_past_strikethrough: getValue("events_show_past_strikethrough", true, boolConverter),
      albums_homepage_columns: getValue("albums_homepage_columns", 3, numConverter),
      updates_homepage_columns: getValue("updates_homepage_columns", 3, numConverter),
      featured_album_id: getValue("featured_album_id", null, stringConverter),
      griffith_albums_homepage_columns: getValue("griffith_albums_homepage_columns", 3, numConverter),
      events_section_show: getValue("events_section_show", true, boolConverter),
      albums_section_show: getValue("albums_section_show", true, boolConverter),
      griffith_section_show: getValue("griffith_section_show", true, boolConverter),
      feature_section_show: getValue("feature_section_show", true, boolConverter),
      updates_section_show: getValue("updates_section_show", true, boolConverter),
      events_section_order: getValue("events_section_order", 1, numConverter),
      albums_section_order: getValue("albums_section_order", 2, numConverter),
      griffith_section_order: getValue("griffith_section_order", 3, numConverter),
      feature_section_order: getValue("feature_section_order", 4, numConverter),
      updates_section_order: getValue("updates_section_order", 5, numConverter),
    };
  } catch (error) {
    console.error("Error fetching homepage site preferences:", error);
    // Return defaults on error
    return {
      events_show_past_strikethrough: true,
      albums_homepage_columns: 3,
      updates_homepage_columns: 3,
      featured_album_id: null,
      griffith_albums_homepage_columns: 3,
      events_section_show: true,
      albums_section_show: true,
      griffith_section_show: true,
      feature_section_show: true,
      updates_section_show: true,
      events_section_order: 1,
      albums_section_order: 2,
      griffith_section_order: 3,
      feature_section_order: 4,
      updates_section_order: 5,
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
