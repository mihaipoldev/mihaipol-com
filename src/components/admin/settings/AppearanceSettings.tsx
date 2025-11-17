"use client"

import { useEffect, useState } from "react"
import { Moon, Sun, Monitor, Palette, Plus, Edit2, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/admin/ShadowSelect"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePrimaryColor } from "@/hooks/use-primary-color"
import { ColorModal } from "@/features/settings/components/ColorModal"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { hexToHsl } from "@/lib/colorUtils"
import type { UserColor } from "@/features/settings/types"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const { primaryColor, setPrimaryColor, mounted: colorMounted, loading: colorLoading } = usePrimaryColor()
  const [mounted, setMounted] = useState(false)
  const [showColorModal, setShowColorModal] = useState(false)
  const [editingColor, setEditingColor] = useState<UserColor | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [savedColors, setSavedColors] = useState<UserColor[]>([])
  const [loadingColors, setLoadingColors] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Get user ID and load saved colors - optimized for faster loading
    const fetchData = async () => {
      try {
        const supabase = getSupabaseBrowser()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user?.id) {
          setUserId(user.id)
          
          // Fetch colors with optimized query (only needed fields for faster loading)
          const { data: colors, error } = await supabase
            .from('user_colors')
            .select('id, user_id, name, hex_value, hsl_h, hsl_s, hsl_l, created_at, updated_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100) // Reasonable limit for performance
          
          if (error) {
            console.error("Error fetching user colors:", error)
          } else {
            setSavedColors(colors || [])
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoadingColors(false)
      }
    }
    fetchData()
  }, [])

  const handleColorSave = async (color: { hex_value: string; name: string }) => {
    if (!userId) return

    try {
      const supabase = getSupabaseBrowser()
      const hsl = hexToHsl(color.hex_value)
      
      if (!hsl) {
        throw new Error('Invalid hex color value')
      }

      if (editingColor) {
        // Update existing color in database
        const updateData: any = {
          name: color.name || null,
          hex_value: color.hex_value,
          hsl_h: hsl.h,
          hsl_s: hsl.s,
          hsl_l: hsl.l,
        }

        const { data: updatedColor, error } = await supabase
          .from('user_colors')
          .update(updateData)
          .eq('id', editingColor.id)
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        
        setSavedColors(prev => prev.map(c => c.id === editingColor.id ? updatedColor : c))
        setPrimaryColor(color.hex_value)
        setShowColorModal(false)
        setEditingColor(null)
      } else {
        // Create new color and save to database
        const { data: newColor, error } = await supabase
          .from('user_colors')
          .insert({
            user_id: userId,
            name: color.name || null,
            hex_value: color.hex_value,
            hsl_h: hsl.h,
            hsl_s: hsl.s,
            hsl_l: hsl.l,
          })
          .select()
          .single()

        if (error) throw error

        setSavedColors(prev => [newColor, ...prev])
        setPrimaryColor(color.hex_value)
        setShowColorModal(false)
      }
    } catch (error) {
      console.error("Failed to save color:", error)
      alert("Failed to save color. Please try again.")
    }
  }

  const handleColorSelect = async (hexValue: string) => {
    // Apply color immediately and save to user_settings
    await setPrimaryColor(hexValue)
  }

  const handleColorDelete = async (colorId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!userId) return

    try {
      const supabase = getSupabaseBrowser()
      const { error } = await supabase
        .from('user_colors')
        .delete()
        .eq('id', colorId)
        .eq('user_id', userId)

      if (error) throw error

      setSavedColors(prev => prev.filter(c => c.id !== colorId))
      // If deleted color was selected, reset to default
      const deletedColor = savedColors.find(c => c.id === colorId)
      if (deletedColor && primaryColor === deletedColor.hex_value) {
        setPrimaryColor("#ff9500") // Default orange
      }
    } catch (error) {
      console.error("Failed to delete color:", error)
      alert("Failed to delete color. Please try again.")
    }
  }

  const handleEditColor = (color: UserColor, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingColor(color)
    setShowColorModal(true)
  }

  // Wait for color to be loaded and mounted before showing to prevent color flash
  if (!mounted || !colorMounted || colorLoading) {
    return null
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden shadow-lg">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
        
        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" style={{ animationDelay: '300ms' }} />
        
        <CardHeader className="relative">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Palette className="h-6 w-6 text-primary" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 relative">
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <div className="font-medium text-lg">Brand Color</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Choose your vibe ✨
              </div>
            </div>
            
            {/* Current Color Display */}
            <div className="mb-6 p-5 rounded-xl border-2 border-border/50 bg-gradient-to-br from-muted/50 via-muted/30 to-transparent backdrop-blur-sm relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
              {/* Animated gradient overlay */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-2xl"
                style={{ 
                  background: `radial-gradient(circle at center, ${primaryColor} 0%, transparent 70%)`
                }}
              />
              <div className="relative flex items-center gap-5">
                <div className="relative group/color">
                  <div 
                    className="w-20 h-20 rounded-xl border-[3px] border-white/90 shadow-2xl transition-all duration-300 group-hover/color:scale-110 group-hover/color:shadow-[0_0_30px_rgba(0,0,0,0.3)]"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div 
                    className="absolute inset-0 rounded-xl blur-xl opacity-60 transition-opacity duration-300 group-hover/color:opacity-80"
                    style={{ backgroundColor: primaryColor }}
                  />
                  {/* Sparkle effect */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 opacity-0 group-hover/color:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-white rounded-full blur-sm animate-pulse" />
                    <div className="absolute inset-0.5 bg-primary rounded-full" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold mb-1.5 flex items-center gap-2">
                    Current Color
                    {primaryColor === savedColors.find(c => c.hex_value === primaryColor)?.hex_value && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {savedColors.find(c => c.hex_value === primaryColor)?.name || 'Custom'}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono font-medium">
                    {primaryColor}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setEditingColor(null)
                    setShowColorModal(true)
                  }}
                  variant="outline"
                  className="relative overflow-hidden group/btn hover:border-primary/50 transition-all duration-300"
                >
                  <div 
                    className="absolute inset-0 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Plus className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10">Add Color</span>
                </Button>
              </div>
            </div>

            {/* Brand Colors Grid */}
            {!loadingColors && (
              <div className="mb-4">
                <div className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <span>Brand Colors</span>
                  {savedColors.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {savedColors.length}
                    </span>
                  )}
                </div>
                {savedColors.length > 0 ? (
                  <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-3">
                  {savedColors.map((color) => (
                    <div key={color.id} className="relative group">
                      <button
                        onClick={() => handleColorSelect(color.hex_value)}
                        className={cn(
                          "relative w-full aspect-square rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl",
                          "border-2 border-white/50 shadow-md",
                          primaryColor === color.hex_value &&
                            "ring-3 ring-primary ring-offset-1 ring-offset-background scale-105 shadow-xl"
                        )}
                        style={{ 
                          backgroundColor: color.hex_value,
                          boxShadow: primaryColor === color.hex_value 
                            ? `0 0 15px ${color.hex_value}40, 0 8px 20px rgba(0,0,0,0.15)` 
                            : undefined
                        }}
                        aria-label={`Select ${color.name || color.hex_value}`}
                      >
                        {/* Glow effect on hover */}
                        <div 
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-lg"
                          style={{ backgroundColor: color.hex_value }}
                        />
                        
                        {/* Selected indicator */}
                        {primaryColor === color.hex_value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <div className="h-2.5 w-2.5 rounded-full bg-white shadow-md animate-pulse" />
                              <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-white/50 animate-ping" />
                            </div>
                          </div>
                        )}
                        
                        {/* Sparkle decoration */}
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-2 h-2 bg-white/90 rounded-full blur-[1px]" />
                        </div>
                      </button>
                      
                      {/* Color name display */}
                      <div className="mt-2 text-center">
                        <div className="text-xs font-medium text-foreground truncate leading-tight">
                          {color.name || 'Unnamed'}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate leading-tight">
                          {color.hex_value}
                        </div>
                      </div>
                      
                      {/* Edit and Delete buttons */}
                      <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10">
                        <button
                          onClick={(e) => handleEditColor(color, e)}
                          className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 hover:scale-110 active:scale-95 transition-all duration-200 shadow-md"
                          title="Edit color"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleColorDelete(color.id, e)}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 hover:scale-110 active:scale-95 transition-all duration-200 shadow-md"
                          title="Delete color"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-8 text-center rounded-xl border-2 border-dashed border-border/50 bg-muted/20">
                    <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-medium mb-1">No saved colors yet</p>
                    <p className="text-xs">Click "Add Color" to create your first custom color!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Modal */}
      {userId && (
        <ColorModal
          isOpen={showColorModal}
          onClose={() => {
            setShowColorModal(false)
            setEditingColor(null)
          }}
          mode={editingColor ? "edit" : "create"}
          initialColor={editingColor ? {
            id: editingColor.id,
            hex_value: editingColor.hex_value,
            name: editingColor.name || ""
          } : undefined}
          defaultColor={primaryColor} // Use current color as default when creating
          onSave={handleColorSave}
          userId={userId}
        />
      )}
    </div>
  )
}
