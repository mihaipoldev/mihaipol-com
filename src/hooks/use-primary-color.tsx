"use client";

import { useEffect, useState } from "react";
import { hexToHsl } from "@/lib/colorUtils";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

const STORAGE_KEY = "primary-color";
const DEFAULT_COLOR = "#ff9500"; // Orange hex color

/**
 * Applies the primary color (hex) to the document by converting to HSL and setting CSS variables
 */
function applyPrimaryColor(hexColor: string) {
  if (typeof document === "undefined") {
    return;
  }

  const body = document.body;
  const html = document.documentElement;

  // Convert hex to HSL
  const hsl = hexToHsl(hexColor);

  if (!hsl) {
    console.error("❌ Failed to convert hex to HSL:", hexColor);
    return;
  }

  // Remove data-brand attributes (we're using hex codes now)
  body.removeAttribute("data-brand");
  html.removeAttribute("data-brand");

  // Apply inline styles IMMEDIATELY for instant visual feedback
  // This runs AFTER React hydration, so no hydration mismatch issues
  const startTime = performance.now();
  console.log("[usePrimaryColor] applyPrimaryColor called at", startTime.toFixed(2) + "ms");
  console.log("[usePrimaryColor] Color:", hexColor, "HSL:", hsl);
  console.log("[usePrimaryColor] Document readyState:", document.readyState);

  const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;

  // Check what's currently applied
  const currentH = document.documentElement.style.getPropertyValue("--brand-h");
  const currentPrimary = document.documentElement.style.getPropertyValue("--primary");
  console.log("[usePrimaryColor] Current --brand-h:", currentH || "(none)");
  console.log("[usePrimaryColor] Current --primary:", currentPrimary || "(none)");

  // Apply to documentElement (doesn't cause hydration issues since React already hydrated)
  if (document.documentElement) {
    console.log("[usePrimaryColor] Applying inline styles to documentElement");
    document.documentElement.style.setProperty("--brand-h", hsl.h.toString(), "important");
    document.documentElement.style.setProperty("--brand-s", `${hsl.s}%`, "important");
    document.documentElement.style.setProperty("--brand-l", `${hsl.l}%`, "important");
    document.documentElement.style.setProperty("--primary", primaryValue, "important");

    // Verify
    const appliedH = document.documentElement.style.getPropertyValue("--brand-h");
    console.log("[usePrimaryColor] Verified --brand-h after apply:", appliedH);
  }

  // Also inject style tag for persistence
  injectColorOverrideStyle(hsl);

  const endTime = performance.now();
  console.log(
    "[usePrimaryColor] ✅ Applied color:",
    hexColor,
    "HSL:",
    hsl,
    "in",
    (endTime - startTime).toFixed(2) + "ms"
  );

  // Force a reflow to ensure visual update
  void body.offsetHeight;

  // Trigger a custom event to notify components
  window.dispatchEvent(new CustomEvent("primaryColorChanged", { detail: { hexColor } }));
}

// Removed applyToElement - we only use style tags to avoid hydration mismatch

// Inject a style tag to override CSS class values with higher specificity
function injectColorOverrideStyle(hsl: { h: number; s: number; l: number }) {
  const styleId = "primary-color-override";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;

  // Use very high specificity selectors to override .preset-balanced
  styleEl.textContent = `
    .preset-balanced,
    body.preset-balanced,
    html .preset-balanced,
    body .preset-balanced {
      --brand-h: ${hsl.h} !important;
      --brand-s: ${hsl.s}% !important;
      --brand-l: ${hsl.l}% !important;
      --primary: ${primaryValue} !important;
    }
    
    :root {
      --brand-h: ${hsl.h} !important;
      --brand-s: ${hsl.s}% !important;
      --brand-l: ${hsl.l}% !important;
      --primary: ${primaryValue} !important;
    }
  `;
}

/**
 * Hook to manage primary color selection with database and sessionStorage persistence
 */
export function usePrimaryColor() {
  const [primaryColor, setPrimaryColorState] = useState<string>(DEFAULT_COLOR);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from database and sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadColor = async () => {
      try {
        // First, try to get user and fetch from database
        let dbColor: string | null = null;
        try {
          const supabase = getSupabaseBrowser();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user?.id) {
            // Fetch style_color from database
            const { data, error } = await supabase
              .from("user_settings")
              .select("style_color")
              .eq("user_id", user.id)
              .maybeSingle();

            if (!error && data?.style_color) {
              dbColor = data.style_color;
            }
          }
        } catch (error) {
          // If we can't get user or fetch from DB, that's okay - use fallback
          console.log("Could not fetch color from database, using fallback");
        }

        // Use database color if available, otherwise try sessionStorage, otherwise use default
        let colorToUse = dbColor;
        if (!colorToUse) {
          const stored = sessionStorage.getItem(STORAGE_KEY);
          if (stored) {
            try {
              // Try to parse as JSON (old format) or use as string (new format)
              const parsed = JSON.parse(stored);
              colorToUse = typeof parsed === "string" ? parsed : parsed.value || DEFAULT_COLOR;
            } catch {
              // If it's not JSON, use it as-is (should be a hex string)
              colorToUse = stored.startsWith("#") ? stored : DEFAULT_COLOR;
            }
          } else {
            colorToUse = DEFAULT_COLOR;
          }
        }

        // Ensure it's a valid hex color
        if (!colorToUse || !colorToUse.startsWith("#")) {
          colorToUse = DEFAULT_COLOR;
        }

        setPrimaryColorState(colorToUse);
        applyPrimaryColor(colorToUse);

        // Save to sessionStorage as cache
        sessionStorage.setItem(STORAGE_KEY, colorToUse);
      } catch (error) {
        console.error("Failed to load primary color:", error);
        applyPrimaryColor(DEFAULT_COLOR);
      } finally {
        setLoading(false);
        setMounted(true);
      }
    };

    loadColor();
  }, []);

  // Function to set primary color
  const setPrimaryColor = async (hexColor: string) => {
    // Validate hex color format
    if (!hexColor || !hexColor.startsWith("#")) {
      console.error("Invalid hex color:", hexColor);
      return;
    }

    // Update state first for instant visual feedback
    setPrimaryColorState(hexColor);
    applyPrimaryColor(hexColor);

    // Save to sessionStorage as cache
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEY, hexColor);
      } catch (error) {
        console.error("❌ Failed to save primary color to sessionStorage:", error);
      }
    }

    // Save to database (async, don't block UI)
    try {
      const supabase = getSupabaseBrowser();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        // Check if record exists
        const { data: existing } = await supabase
          .from("user_settings")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          // Record exists, use UPDATE
          const { error } = await supabase
            .from("user_settings")
            .update({ style_color: hexColor })
            .eq("user_id", user.id);

          if (error) throw error;
        } else {
          // Record doesn't exist, use INSERT
          const { error } = await supabase.from("user_settings").insert({
            user_id: user.id,
            role: "user",
            style_color: hexColor,
          });

          if (error) throw error;
        }
      }
    } catch (error) {
      console.error("❌ Failed to save primary color to database:", error);
      // Don't throw - we've already updated the UI
    }
  };

  return {
    primaryColor,
    setPrimaryColor,
    mounted,
    loading,
  };
}
