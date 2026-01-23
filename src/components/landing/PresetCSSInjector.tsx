"use client";

import { useEffect } from "react";

/**
 * Client component that injects preset CSS into the document head
 * This fetches CSS from the API endpoint and injects it into the page
 */
export function PresetCSSInjector() {
  useEffect(() => {
    // Check if CSS is already injected
    const existingStyle = document.getElementById("custom-presets-css");
    if (existingStyle) {
      console.log("[PresetCSSInjector] CSS already injected, removing and reloading to get latest");
      existingStyle.remove();
    }

    // Fetch CSS from API endpoint with cache-busting
    const cacheBuster = `?t=${Date.now()}`;
    console.log("[PresetCSSInjector] Fetching preset CSS from API...");
    
    fetch(`/api/admin/settings/presets/css${cacheBuster}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch CSS: ${res.status}`);
        }
        return res.text();
      })
      .then((css) => {
        if (css && css.trim()) {
          const styleEl = document.createElement("style");
          styleEl.id = "custom-presets-css";
          styleEl.textContent = css;
          document.head.appendChild(styleEl);
          
          // Check if presets 27-28 are in the CSS
          const hasPreset27 = css.includes('preset-landing-page-27');
          const hasPreset28 = css.includes('preset-landing-page-28');
          
          console.log("[PresetCSSInjector] ✅ Injected preset CSS", {
            cssLength: css.length,
            hasPreset27,
            hasPreset28,
            presetCount: (css.match(/preset-landing-page-\d+/g) || []).length,
          });
        } else {
          console.warn("[PresetCSSInjector] No CSS received from API");
        }
      })
      .catch((error) => {
        console.error("[PresetCSSInjector] Failed to load preset CSS:", error);
      });
  }, []);

  return null;
}
