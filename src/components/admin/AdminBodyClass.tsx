"use client";

import { useEffect } from "react";
import { usePrimaryColor } from "@/hooks/use-primary-color";

export function AdminBodyClass() {
  // Use the hook to ensure primary color is loaded and applied on mount
  usePrimaryColor();

  useEffect(() => {
    // Add preset-balanced class to body so CSS variables are available globally
    // This ensures Portal-rendered content (like dropdowns) can access the variables
    document.body.classList.add("preset-balanced");

    // Prevent html/body scrolling on admin pages to avoid double scrollbar
    // Only the main element should scroll
    // Set html and body to exact viewport height with no overflow
    const setStyles = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty("overflow", "hidden", "important");
      document.documentElement.style.setProperty("height", `${vh}px`, "important");
      document.documentElement.style.setProperty("max-height", `${vh}px`, "important");
      document.body.style.setProperty("overflow", "hidden", "important");
      document.body.style.setProperty("height", `${vh}px`, "important");
      document.body.style.setProperty("max-height", `${vh}px`, "important");
      document.body.style.setProperty("margin", "0", "important");
      document.body.style.setProperty("padding", "0", "important");
      document.body.style.setProperty("position", "relative", "important");
    };

    setStyles();

    // Also set on resize to prevent any height changes
    window.addEventListener("resize", setStyles);

    return () => {
      // Clean up when component unmounts (though this shouldn't happen in admin)
      document.body.classList.remove("preset-balanced");
      window.removeEventListener("resize", setStyles);
      document.documentElement.style.removeProperty("overflow");
      document.documentElement.style.removeProperty("height");
      document.documentElement.style.removeProperty("max-height");
      document.body.style.removeProperty("overflow");
      document.body.style.removeProperty("height");
      document.body.style.removeProperty("max-height");
      document.body.style.removeProperty("margin");
      document.body.style.removeProperty("padding");
    };
  }, []);

  return null;
}
