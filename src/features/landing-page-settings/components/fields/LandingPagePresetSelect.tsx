"use client";

import { useMemo, useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { hslToCss, type LandingPagePreset } from "@/lib/landing-page-presets";
import { Edit2, Trash2, Plus, ChevronDown, Check, Copy, Star } from "lucide-react";
import { PresetForm } from "../presets/PresetForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LandingPagePresetSelectProps {
  value: LandingPagePreset | number | string | null | undefined;
  onChange: (preset: LandingPagePreset) => void;
  disabled?: boolean;
}

export function LandingPagePresetSelect({ value, onChange, disabled }: LandingPagePresetSelectProps) {
  const [allPresets, setAllPresets] = useState<LandingPagePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<LandingPagePreset | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingPreset, setDeletingPreset] = useState<LandingPagePreset | null>(null);

  useEffect(() => {
    // Fetch all presets from API (all presets are stored in JSON file)
    setIsLoading(true);
    fetch("/api/admin/settings/presets")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        // Check for error response
        if (data && typeof data === 'object' && 'error' in data) {
          console.error("API error:", data.error);
          setAllPresets([]);
          return;
        }
        
        // API returns presets directly as an array (ok() returns data directly)
        // Check if response is an array or wrapped
        let presets: LandingPagePreset[] = [];
        
        if (Array.isArray(data)) {
          presets = data;
        } else if (data && typeof data === 'object') {
          // Handle wrapped response (though API should return directly)
          presets = data.data || data.presets || [];
        }
        
        if (Array.isArray(presets)) {
          // Sort presets: favorites first, then by ID
          const sortedPresets = [...presets].sort((a, b) => {
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return a.id - b.id;
          });
          setAllPresets(sortedPresets);
        } else {
          console.error("Unexpected API response format:", data);
          setAllPresets([]);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch presets:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Extract preset from value (handles both object and number formats)
  const selectedPreset = useMemo(() => {
    // If value is already a preset object
    if (value && typeof value === "object" && "id" in value && "name" in value) {
      return value as LandingPagePreset;
    }
    
    // If value is a number or string number, look it up
    const presetId = typeof value === "number" ? value : Number(value);
    if (!isNaN(presetId)) {
      return allPresets.find((p) => p.id === presetId);
    }
    
    // Default to preset 19
    return allPresets.find((p) => p.id === 19) || allPresets[0];
  }, [value, allPresets]);

  const handlePresetSelect = (preset: LandingPagePreset) => {
    onChange(preset);
    setIsPopoverOpen(false);
  };

  const handleCreate = async (presetData: Omit<LandingPagePreset, "id">) => {
    try {
      const response = await fetch("/api/admin/settings/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presetData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create preset");
      }

      const newPreset = await response.json();
      toast.success("Preset created successfully");
      
      // Refresh presets list
      const refreshResponse = await fetch("/api/admin/settings/presets");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const presets = Array.isArray(data) ? data : (data?.data || []);
        const sortedPresets = [...presets].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.id - b.id;
        });
        setAllPresets(sortedPresets);
      }
      
      // Select the newly created preset
      if (newPreset && typeof newPreset === 'object' && 'id' in newPreset) {
        onChange(newPreset as LandingPagePreset);
      }
      
      setIsCreateOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create preset");
      throw error;
    }
  };

  const handleEdit = async (presetData: Omit<LandingPagePreset, "id">) => {
    if (!editingPreset) return;

    try {
      const response = await fetch("/api/admin/settings/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPreset.id,
          ...presetData,
          favorite: editingPreset.favorite ?? false, // Preserve favorite status
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update preset");
      }

      const updatedPreset = await response.json();
      toast.success("Preset updated successfully");
      
      // Refresh presets list
      const refreshResponse = await fetch("/api/admin/settings/presets");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const presets = Array.isArray(data) ? data : (data?.data || []);
        const sortedPresets = [...presets].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.id - b.id;
        });
        setAllPresets(sortedPresets);
      }
      
      // Update selected preset if it was the one being edited
      if (selectedPreset?.id === editingPreset.id && updatedPreset) {
        onChange(updatedPreset as LandingPagePreset);
      }
      
      setEditingPreset(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to update preset");
      throw error;
    }
  };

  const handleDuplicate = async (preset: LandingPagePreset) => {
    try {
      const duplicateName = `Copy of ${preset.name}`;
      
      const response = await fetch("/api/admin/settings/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: duplicateName,
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent,
          favorite: false, // Duplicates start as not favorite
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to duplicate preset");
      }

      const newPreset = await response.json();
      toast.success("Preset duplicated successfully");
      
      // Refresh presets list
      const refreshResponse = await fetch("/api/admin/settings/presets");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const presets = Array.isArray(data) ? data : (data?.data || []);
        const sortedPresets = [...presets].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.id - b.id;
        });
        setAllPresets(sortedPresets);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate preset");
    }
  };

  const handleToggleFavorite = async (preset: LandingPagePreset, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent preset selection when clicking star
    
    try {
      const response = await fetch("/api/admin/settings/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: preset.id,
          name: preset.name,
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent,
          favorite: !preset.favorite,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update favorite");
      }

      toast.success(preset.favorite ? "Removed from favorites" : "Added to favorites");
      
      // Refresh presets list
      const refreshResponse = await fetch("/api/admin/settings/presets");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const presets = Array.isArray(data) ? data : (data?.data || []);
        const sortedPresets = [...presets].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.id - b.id;
        });
        setAllPresets(sortedPresets);
        
        // Update selected preset if it was the one being favorited
        if (selectedPreset?.id === preset.id) {
          const updatedPreset = sortedPresets.find((p) => p.id === preset.id);
          if (updatedPreset) {
            onChange(updatedPreset);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorite");
    }
  };

  const handleDelete = async () => {
    if (!deletingPreset) return;

    try {
      const response = await fetch(`/api/admin/settings/presets?id=${deletingPreset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete preset");
      }

      toast.success("Preset deleted successfully");
      
      // Refresh presets list
      const refreshResponse = await fetch("/api/admin/settings/presets");
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        const presets = Array.isArray(data) ? data : (data?.data || []);
        const sortedPresets = [...presets].sort((a, b) => {
          if (a.favorite && !b.favorite) return -1;
          if (!a.favorite && b.favorite) return 1;
          return a.id - b.id;
        });
        setAllPresets(sortedPresets);
        
        // If deleted preset was selected, select default (19) or first available
        if (selectedPreset?.id === deletingPreset.id) {
          const defaultPreset = sortedPresets.find((p) => p.id === 19) || sortedPresets[0];
          if (defaultPreset) {
            onChange(defaultPreset);
          }
        }
      }
      
      setDeletingPreset(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete preset");
    }
  };

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="flex h-9 w-[300px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm opacity-50 cursor-not-allowed"
      >
        <span className="text-muted-foreground">Loading presets...</span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>
    );
  }

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex h-9 w-[300px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background transition-all duration-200",
              "hover:border-foreground/30",
              "focus:outline-none focus:ring-1 focus:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled || allPresets.length === 0}
          >
            <div className="flex items-center gap-2 flex-1 text-left">
              {selectedPreset && (
                <div
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                  style={{
                    background: `conic-gradient(from 0deg, ${hslToCss(selectedPreset.primary)} 0deg 72deg, ${hslToCss(selectedPreset.secondary)} 120deg 192deg, ${hslToCss(selectedPreset.accent)} 240deg 312deg, ${hslToCss(selectedPreset.primary)} 360deg)`,
                  }}
                  title={`Primary: ${selectedPreset.primary}, Secondary: ${selectedPreset.secondary}, Accent: ${selectedPreset.accent}`}
                />
              )}
              <span className={cn(
                "flex-1 text-left",
                !selectedPreset && "text-muted-foreground"
              )}>
                {selectedPreset?.name || "Select preset..."}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0 bg-background/50 backdrop-blur-md border overflow-hidden" align="start">
          {allPresets.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">No presets available</p>
              <Button onClick={() => setIsCreateOpen(true)} size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Create First Preset
              </Button>
            </div>
          ) : (
            <>
              <div className="max-h-[400px] overflow-y-auto">
                {allPresets.map((preset) => {
                  const isSelected = selectedPreset?.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetSelect(preset)}
                      className={cn(
                        "relative flex items-center gap-3 px-3 py-2 transition-colors group rounded-none overflow-hidden cursor-pointer",
                        "hover:bg-muted/50",
                        isSelected && "bg-muted/30"
                      )}
                    >
                      {/* Color dot */}
                      <div
                        className="w-5 h-5 rounded-full shadow-sm flex-shrink-0 z-10"
                        style={{
                          background: `conic-gradient(from 0deg, ${hslToCss(preset.primary)} 0deg 72deg, ${hslToCss(preset.secondary)} 120deg 192deg, ${hslToCss(preset.accent)} 240deg 312deg, ${hslToCss(preset.primary)} 360deg)`,
                        }}
                        title={`Primary: ${preset.primary}, Secondary: ${preset.secondary}, Accent: ${preset.accent}`}
                      />
                      
                      {/* Preset name - full width */}
                      <div
                        className={cn(
                          "flex-1 text-left flex items-center gap-2 transition-colors min-w-0",
                          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {/* Star icon - always visible */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleFavorite(preset, e)}
                          className={cn(
                            "flex-shrink-0 p-0.5 rounded transition-all",
                            preset.favorite 
                              ? "text-primary" 
                              : "text-muted-foreground hover:text-primary"
                          )}
                          title={preset.favorite ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star 
                            className={cn(
                              "transition-all",
                              preset.favorite 
                                ? "h-4 w-4 fill-current" 
                                : "h-3.5 w-3.5"
                            )} 
                          />
                        </button>
                        <span className="text-sm font-medium whitespace-nowrap">{preset.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      
                      {/* Action buttons - positioned absolutely on top of text, overlaying it */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-popover/100 px-1 rounded z-20 pointer-events-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(preset);
                          }}
                          title="Duplicate preset"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingPreset(preset);
                            setIsPopoverOpen(false);
                          }}
                          title="Edit preset"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingPreset(preset);
                            setIsPopoverOpen(false);
                          }}
                          title="Delete preset"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <Separator />
              
              {/* Create new preset button */}
              <div className="p-2">
                <Button
                  onClick={() => {
                    setIsCreateOpen(true);
                    setIsPopoverOpen(false);
                  }}
                  size="sm"
                  className="w-full"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Preset
                </Button>
              </div>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Create Preset Modal */}
      <PresetForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* Edit Preset Modal */}
      {editingPreset && (
        <PresetForm
          isOpen={!!editingPreset}
          onClose={() => setEditingPreset(null)}
          onSubmit={handleEdit}
          initialPreset={editingPreset}
          mode="edit"
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingPreset} onOpenChange={(open) => !open && setDeletingPreset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingPreset?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
