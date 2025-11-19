import { supabase } from "@/lib/supabase";
import { hexToHsl } from "@/lib/colorUtils";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { UserColor } from "./types";

/**
 * Update style_color in user_settings
 */
export async function updateStyleColor(userId: string, hexColor: string): Promise<void> {
  try {
    // First check if record exists
    const { data: existing } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Record exists, use UPDATE
      const { error } = await supabase
        .from("user_settings")
        .update({ style_color: hexColor })
        .eq("user_id", userId);

      if (error) throw error;
    } else {
      // Record doesn't exist, use INSERT with proper defaults
      const { error } = await supabase.from("user_settings").insert({
        user_id: userId,
        role: "user",
        style_color: hexColor,
      });

      if (error) throw error;
    }
  } catch (error) {
    console.error("Error updating style color:", error);
    throw error;
  }
}

/**
 * Create a new user color
 */
export async function createUserColor(
  userId: string,
  hexValue: string,
  name?: string
): Promise<UserColor> {
  try {
    const hsl = hexToHsl(hexValue);
    if (!hsl) {
      throw new Error("Invalid hex color value");
    }

    const { data, error } = await supabase
      .from("user_colors")
      .insert({
        user_id: userId,
        name: name || null,
        hex_value: hexValue,
        hsl_h: hsl.h,
        hsl_s: hsl.s,
        hsl_l: hsl.l,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating user color:", error);
    throw error;
  }
}

/**
 * Update an existing user color
 */
export async function updateUserColor(
  userId: string,
  colorId: string,
  updates: {
    name?: string;
    hex_value?: string;
  }
): Promise<UserColor> {
  try {
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name || null;
    }

    if (updates.hex_value) {
      const hsl = hexToHsl(updates.hex_value);
      if (!hsl) {
        throw new Error("Invalid hex color value");
      }
      updateData.hex_value = updates.hex_value;
      updateData.hsl_h = hsl.h;
      updateData.hsl_s = hsl.s;
      updateData.hsl_l = hsl.l;
    }

    const { data, error } = await supabase
      .from("user_colors")
      .update(updateData)
      .eq("id", colorId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user color:", error);
    throw error;
  }
}

/**
 * Delete a user color
 */
export async function deleteUserColor(userId: string, colorId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("user_colors")
      .delete()
      .eq("id", colorId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting user color:", error);
    throw error;
  }
}

/**
 * Update a site preference (admin only)
 */
export async function updateSitePreference(key: string, value: any): Promise<void> {
  try {
    const supabaseClient = getServiceSupabaseClient();

    // Check if preference exists
    const { data: existing } = await supabaseClient
      .from("site_preferences")
      .select("key")
      .eq("key", key)
      .maybeSingle();

    if (existing) {
      // Update existing preference
      const { error } = await supabaseClient
        .from("site_preferences")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    } else {
      // Preference doesn't exist, cannot create via this function
      throw new Error(`Preference with key "${key}" does not exist`);
    }
  } catch (error) {
    console.error("Error updating site preference:", error);
    throw error;
  }
}
