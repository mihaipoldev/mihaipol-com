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
      return; // Already injected
    }

    // Fetch CSS from API endpoint
    fetch("/api/admin/settings/presets/css")
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
          console.log("[PresetCSSInjector] Injected preset CSS");
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
