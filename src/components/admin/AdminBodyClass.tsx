"use client"

import { useEffect } from "react"
import { usePrimaryColor } from "@/hooks/use-primary-color"

export function AdminBodyClass() {
  // Use the hook to ensure primary color is loaded and applied on mount
  usePrimaryColor()

  useEffect(() => {
    // Add preset-balanced class to body so CSS variables are available globally
    // This ensures Portal-rendered content (like dropdowns) can access the variables
    document.body.classList.add("preset-balanced")
    
    return () => {
      // Clean up when component unmounts (though this shouldn't happen in admin)
      document.body.classList.remove("preset-balanced")
    }
  }, [])

  return null
}

