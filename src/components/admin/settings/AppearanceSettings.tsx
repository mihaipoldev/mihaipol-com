"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Monitor, Palette, Plus } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePrimaryColor, type BrandColorValue } from "@/hooks/use-primary-color"

const brandColors = [
  { name: "Slate", value: "slate", color: "hsl(215, 16%, 47%)" },
  { name: "Blue", value: "blue", color: "hsl(217, 91%, 60%)" },
  { name: "Indigo", value: "indigo", color: "hsl(239, 84%, 67%)" },
  { name: "Violet", value: "violet", color: "hsl(262, 83%, 58%)" },
  { name: "Cyan", value: "cyan", color: "hsl(188, 94%, 43%)" },
  { name: "Turquoise", value: "turquoise", color: "hsl(174, 60%, 51%)" },
  { name: "Yellow", value: "yellow", color: "hsl(45, 93%, 47%)" },
  { name: "Orange", value: "orange", color: "hsl(25, 95%, 53%)" },
  { name: "Coral", value: "coral", color: "hsl(9, 95%, 65%)" },
  { name: "Red", value: "red", color: "hsl(0, 84%, 60%)" },
]

const customColors = [
  { name: "Purple", value: "#afd3e2" },
  { name: "Pink", value: "#ca7df9" },
  { name: "Green", value: "#4ade80" },
  { name: "Bitter", value: "#84cc16" },
  { name: "Sunflower", value: "#fbbf24" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Aqua", value: "#06b6d4" },
  { name: "Mint", value: "#10b981" },
  { name: "Face", value: "#ec4899" },
  { name: "Apple", value: "#22c55e" },
  { name: "Dell", value: "#14b8a6" },
  { name: "What", value: "#8b5cf6" },
  { name: "Coca", value: "#ef4444" },
]

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { primaryColor, setPrimaryColor, mounted: colorMounted } = usePrimaryColor()
  const [mounted, setMounted] = useState(false)

  // Initialize selected colors from the hook
  const selectedBrandColor = primaryColor.type === "brand" ? (primaryColor.value as BrandColorValue) : null
  const selectedCustomColor = primaryColor.type === "custom" ? primaryColor.value : null

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !colorMounted) {
    return null
  }

  const handleBrandColorSelect = (colorValue: BrandColorValue) => {
    console.log("🖱️ Brand color clicked:", colorValue)
    console.log("📊 Current primaryColor:", primaryColor)
    console.log("📊 Current selectedBrandColor:", selectedBrandColor)
    
    // Immediately apply the brand color
    const newColor = { type: "brand" as const, value: colorValue }
    console.log("🎯 Setting new color:", newColor)
    setPrimaryColor(newColor)
  }

  const handleCustomColorSelect = (colorValue: string) => {
    console.log("🖱️ Custom color clicked:", colorValue)
    console.log("📊 Current primaryColor:", primaryColor)
    console.log("📊 Current selectedCustomColor:", selectedCustomColor)
    
    // Toggle: if already selected, deselect (revert to default)
    if (selectedCustomColor === colorValue) {
      console.log("🔄 Toggling off, reverting to default orange")
      setPrimaryColor({ type: "brand", value: "orange" })
    } else {
      // Immediately apply the custom color
      const newColor = { type: "custom" as const, value: colorValue }
      console.log("🎯 Setting new custom color:", newColor)
      setPrimaryColor(newColor)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Theme</div>
              <div className="text-sm text-muted-foreground">
                Choose your interface theme
              </div>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-[180px]">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )}
                  <SelectValue>
                    {theme === "dark"
                      ? "Dark"
                      : theme === "light"
                      ? "Light"
                      : "System"}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                  </div>
                </SelectItem>
                <SelectItem value="dark">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                  </div>
                </SelectItem>
                <SelectItem value="system">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Brand Color Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <div className="font-medium">Brand Color</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Choose your vibe ✨
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {brandColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleBrandColorSelect(color.value as BrandColorValue)}
                  className={cn(
                    "relative h-12 w-12 rounded-full transition-all duration-200 hover:scale-110",
                    selectedBrandColor === color.value &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: color.color }}
                  aria-label={`Select ${color.name} color`}
                >
                  {selectedBrandColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Colors Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="font-medium">Custom Colors</div>
              <div className="text-sm text-muted-foreground">
                Your palette 🎨
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3 mb-4">
              {customColors.map((color, index) => (
                <button
                  key={index}
                  onClick={() => handleCustomColorSelect(color.value)}
                  className={cn(
                    "relative h-12 w-12 rounded-full transition-all duration-200 hover:scale-110",
                    selectedCustomColor === color.value &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: color.value }}
                  aria-label={`Select ${color.name} color`}
                >
                  {selectedCustomColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button variant="outline" className="w-full border-dashed">
              <Plus className="h-4 w-4 mr-2" />
              ADD
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

