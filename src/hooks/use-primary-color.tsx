"use client"

import { useEffect, useState } from "react"

export type PrimaryColorType = "brand" | "custom"
export type BrandColorValue = 
  | "slate" 
  | "blue" 
  | "indigo" 
  | "violet" 
  | "cyan" 
  | "turquoise" 
  | "yellow" 
  | "orange" 
  | "coral" 
  | "red"

export interface PrimaryColor {
  type: PrimaryColorType
  value: BrandColorValue | string // BrandColorValue for brand, hex string for custom
}

const STORAGE_KEY = "primary-color"
const DEFAULT_COLOR: PrimaryColor = { type: "brand", value: "orange" }

/**
 * Converts hex color to HSL values
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  // Remove # if present
  hex = hex.replace("#", "")
  
  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0 // achromatic
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * Applies the primary color to the document
 */
function applyPrimaryColor(color: PrimaryColor) {
  console.log("🎨 applyPrimaryColor called with:", color)
  
  if (typeof document === "undefined") {
    console.log("❌ Document is undefined, returning early")
    return
  }

  const body = document.body
  const html = document.documentElement

  console.log("📝 Current body classes:", body.className)
  console.log("📝 Current body data-brand:", body.getAttribute("data-brand"))
  console.log("📝 Current html data-brand:", html.getAttribute("data-brand"))

  if (color.type === "brand") {
    console.log("🎯 Applying brand color:", color.value)
    
    // Brand color HSL values mapping
    const brandColorMap: Record<BrandColorValue, { h: number; s: string; l: string }> = {
      slate: { h: 215, s: "20%", l: "45%" },
      blue: { h: 217, s: "91%", l: "60%" },
      indigo: { h: 239, s: "84%", l: "67%" },
      violet: { h: 262, s: "83%", l: "58%" },
      cyan: { h: 188, s: "94%", l: "42%" },
      turquoise: { h: 174, s: "77%", l: "40%" },
      yellow: { h: 48, s: "96%", l: "53%" },
      orange: { h: 24, s: "94%", l: "50%" },
      coral: { h: 16, s: "100%", l: "66%" },
      red: { h: 0, s: "84%", l: "60%" },
    }
    
    const brandColor = brandColorMap[color.value as BrandColorValue]
    
    if (brandColor) {
      // Set the brand color via data-brand attribute (for CSS fallback)
      body.setAttribute("data-brand", color.value as BrandColorValue)
      html.setAttribute("data-brand", color.value as BrandColorValue)
      
      // IMPORTANT: Set CSS variables directly on body (which has .preset-balanced class)
      // Use "important" flag to override the hardcoded values in .preset-balanced CSS
      body.style.setProperty("--brand-h", brandColor.h.toString(), "important")
      body.style.setProperty("--brand-s", brandColor.s, "important")
      body.style.setProperty("--brand-l", brandColor.l, "important")
      
      // Also set on html for cascade
      html.style.setProperty("--brand-h", brandColor.h.toString(), "important")
      html.style.setProperty("--brand-s", brandColor.s, "important")
      html.style.setProperty("--brand-l", brandColor.l, "important")
      
      // Directly set --primary on body (where .preset-balanced is) to ensure it updates immediately
      const primaryValue = `${brandColor.h} ${brandColor.s} ${brandColor.l}`
      body.style.setProperty("--primary", primaryValue, "important")
      html.style.setProperty("--primary", primaryValue, "important")
      
      console.log("✅ Set data-brand to:", color.value)
      console.log("✅ Set CSS variables directly on body (preset-balanced):")
      console.log("  --brand-h:", brandColor.h)
      console.log("  --brand-s:", brandColor.s)
      console.log("  --brand-l:", brandColor.l)
      console.log("  --primary:", primaryValue)
      
      // Check computed styles on body (where .preset-balanced is)
      const bodyComputed = window.getComputedStyle(body)
      console.log("🎨 Computed on body --brand-h:", bodyComputed.getPropertyValue("--brand-h"))
      console.log("🎨 Computed on body --brand-s:", bodyComputed.getPropertyValue("--brand-s"))
      console.log("🎨 Computed on body --brand-l:", bodyComputed.getPropertyValue("--brand-l"))
      console.log("🎨 Computed on body --primary:", bodyComputed.getPropertyValue("--primary"))
      
      // Check inline styles
      console.log("🔍 Body inline --brand-h:", body.style.getPropertyValue("--brand-h"))
      console.log("🔍 Body inline --primary:", body.style.getPropertyValue("--primary"))
      
      // Force a reflow to ensure visual update
      void body.offsetHeight
      
      // Trigger a custom event to notify components
      window.dispatchEvent(new CustomEvent("primaryColorChanged", { detail: color }))
    } else {
      console.error("❌ Unknown brand color:", color.value)
    }
  } else {
    console.log("🎯 Applying custom color:", color.value)
    
    // For custom colors, convert hex to HSL and set CSS variables
    const hsl = hexToHsl(color.value as string)
    console.log("🌈 Converted HSL:", hsl)
    
    if (hsl) {
      // Remove data-brand attributes first
      body.removeAttribute("data-brand")
      html.removeAttribute("data-brand")
      
      // IMPORTANT: Set CSS variables directly on body (which has .preset-balanced class)
      // Use "important" flag to override the hardcoded values in .preset-balanced CSS
      body.style.setProperty("--brand-h", hsl.h.toString(), "important")
      body.style.setProperty("--brand-s", `${hsl.s}%`, "important")
      body.style.setProperty("--brand-l", `${hsl.l}%`, "important")
      
      // Also set on html for cascade
      html.style.setProperty("--brand-h", hsl.h.toString(), "important")
      html.style.setProperty("--brand-s", `${hsl.s}%`, "important")
      html.style.setProperty("--brand-l", `${hsl.l}%`, "important")
      
      // Directly set --primary on body (where .preset-balanced is) to ensure it updates immediately
      const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`
      body.style.setProperty("--primary", primaryValue, "important")
      html.style.setProperty("--primary", primaryValue, "important")
      
      console.log("✅ Set CSS variables directly on body (preset-balanced):")
      console.log("  --brand-h:", hsl.h)
      console.log("  --brand-s:", `${hsl.s}%`)
      console.log("  --brand-l:", `${hsl.l}%`)
      console.log("  --primary:", primaryValue)
      
      // Check computed styles on body (where .preset-balanced is)
      const bodyComputed = window.getComputedStyle(body)
      console.log("🎨 Computed on body --brand-h:", bodyComputed.getPropertyValue("--brand-h"))
      console.log("🎨 Computed on body --brand-s:", bodyComputed.getPropertyValue("--brand-s"))
      console.log("🎨 Computed on body --brand-l:", bodyComputed.getPropertyValue("--brand-l"))
      console.log("🎨 Computed on body --primary:", bodyComputed.getPropertyValue("--primary"))
      
      // Check inline styles
      console.log("🔍 Body inline --brand-h:", body.style.getPropertyValue("--brand-h"))
      console.log("🔍 Body inline --primary:", body.style.getPropertyValue("--primary"))
      
      // Force a reflow to ensure visual update
      void body.offsetHeight
      
      // Trigger a custom event to notify components
      window.dispatchEvent(new CustomEvent("primaryColorChanged", { detail: color }))
    } else {
      console.error("❌ Failed to convert hex to HSL")
    }
  }
}

/**
 * Hook to manage primary color selection with sessionStorage persistence
 */
export function usePrimaryColor() {
  const [primaryColor, setPrimaryColorState] = useState<PrimaryColor>(DEFAULT_COLOR)
  const [mounted, setMounted] = useState(false)

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as PrimaryColor
        setPrimaryColorState(parsed)
        applyPrimaryColor(parsed)
      } else {
        // Apply default on first load
        applyPrimaryColor(DEFAULT_COLOR)
      }
    } catch (error) {
      console.error("Failed to load primary color from sessionStorage:", error)
      applyPrimaryColor(DEFAULT_COLOR)
    } finally {
      setMounted(true)
    }
  }, [])

  // Function to set primary color
  const setPrimaryColor = (color: PrimaryColor) => {
    console.log("🔧 setPrimaryColor called with:", color)
    console.log("📦 Current state before update:", primaryColor)
    
    // Update state first
    setPrimaryColorState(color)
    console.log("✅ State updated to:", color)
    
    // Apply immediately for instant visual feedback
    console.log("🚀 Calling applyPrimaryColor...")
    applyPrimaryColor(color)
    
    // Save to sessionStorage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(color))
        console.log("💾 Saved to sessionStorage:", color)
      } catch (error) {
        console.error("❌ Failed to save primary color to sessionStorage:", error)
      }
    }
  }

  return {
    primaryColor,
    setPrimaryColor,
    mounted,
  }
}

