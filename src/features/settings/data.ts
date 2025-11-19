import { supabase } from "@/lib/supabase";
import type { UserSettings, UserColor, SitePreference } from "./types";

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
  category: "events" | "albums" | "updates" | "general"
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
