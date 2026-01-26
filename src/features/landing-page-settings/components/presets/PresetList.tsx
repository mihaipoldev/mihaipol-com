"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PresetForm } from "./PresetForm";
import type { LandingPagePreset } from "@/lib/landing-page-presets";
import { hslToCss } from "@/lib/landing-page-presets";
import { Edit2, Trash2, Plus, Sparkles, Loader2, Copy, Heart } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { hslToHex } from "@/lib/colorUtils";

interface PresetListProps {
  presets: LandingPagePreset[];
  onRefresh: () => void;
}

export function PresetList({ presets, onRefresh }: PresetListProps) {
  const [editingPreset, setEditingPreset] = useState<LandingPagePreset | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [generatingNameId, setGeneratingNameId] = useState<number | null>(null);
  const [isGeneratingPreset, setIsGeneratingPreset] = useState(false);

  // Helper function to parse HSL string and convert to hex
  const hslStringToHex = (hsl: string): string => {
    const parts = hsl.trim().split(/\s+/);
    const h = parseInt(parts[0], 10);
    const s = parseInt(parts[1].replace("%", ""), 10);
    const l = parseInt(parts[2].replace("%", ""), 10);
    return hslToHex(h, s, l);
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

      toast.success("Preset created successfully");
      onRefresh();
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

      toast.success("Preset updated successfully");
      setEditingPreset(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update preset");
      throw error;
    }
  };

  const handleToggleFavorite = async (preset: LandingPagePreset) => {
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
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorite");
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

      toast.success("Preset duplicated successfully");
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to duplicate preset");
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/admin/settings/presets?id=${deletingId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete preset");
      }

      toast.success("Preset deleted successfully");
      setDeletingId(null);
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete preset");
    }
  };

  const handleGenerateName = async (preset: LandingPagePreset) => {
    try {
      setGeneratingNameId(preset.id);

      // Convert HSL colors to hex for API call
      const primaryHex = hslStringToHex(preset.primary);
      const secondaryHex = hslStringToHex(preset.secondary);
      const accentHex = hslStringToHex(preset.accent);

      // Call AI API to generate preset name
      const response = await fetch("/api/admin/ai/generate-preset-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primary_color: primaryHex,
          secondary_color: secondaryHex,
          accent_color: accentHex,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate preset name");
      }

      const data = await response.json();
      const generatedName = data.name;

      if (!generatedName || !generatedName.trim()) {
        throw new Error("Generated name is empty");
      }

      // Update preset name via PUT request
      const updateResponse = await fetch("/api/admin/settings/presets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: preset.id,
          name: generatedName.trim(),
          primary: preset.primary,
          secondary: preset.secondary,
          accent: preset.accent,
          favorite: preset.favorite ?? false,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.error || "Failed to update preset name");
      }

      toast.success(`Preset name updated to "${generatedName.trim()}"`);
      onRefresh();
    } catch (error: any) {
      console.error("Error generating preset name:", error);
      toast.error(error.message || "Failed to generate preset name");
    } finally {
      setGeneratingNameId(null);
    }
  };

  const handleGeneratePreset = async (style: "artistic" | "vibrant") => {
    try {
      setIsGeneratingPreset(true);

      // Call AI API to generate complete preset with style parameter
      const response = await fetch("/api/admin/ai/generate-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate preset");
      }

      const presetData = await response.json();

      // Create new preset via POST request
      const createResponse = await fetch("/api/admin/settings/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presetData),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create preset");
      }

      toast.success(`Preset "${presetData.name}" created successfully`);
      onRefresh();
    } catch (error: any) {
      console.error("Error generating preset:", error);
      toast.error(error.message || "Failed to generate preset");
    } finally {
      setIsGeneratingPreset(false);
    }
  };

  if (presets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No presets yet</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Preset
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                disabled={isGeneratingPreset}
                variant="outline"
              >
                {isGeneratingPreset ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate with AI
                    <FontAwesomeIcon icon={faChevronDown} className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end"
              className="px-0 py-2 border-0 w-56"
              style={{
                boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px'
              }}
            >
              <DropdownMenuItem
                onClick={() => handleGeneratePreset("artistic")}
                disabled={isGeneratingPreset}
                className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Artistic & Mystic
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleGeneratePreset("vibrant")}
                disabled={isGeneratingPreset}
                className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Vibrant & Bold
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <PresetForm
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          mode="create"
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium">Presets ({presets.length})</h4>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isGeneratingPreset}
                  size="sm"
                  variant="outline"
                >
                  {isGeneratingPreset ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate with AI
                      <FontAwesomeIcon icon={faChevronDown} className="ml-1 h-3 w-3" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end"
                className="px-0 py-2 border-0 w-56"
                style={{
                  boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px'
                }}
              >
                <DropdownMenuItem
                  onClick={() => handleGeneratePreset("artistic")}
                  disabled={isGeneratingPreset}
                  className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Artistic & Mystic
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleGeneratePreset("vibrant")}
                  disabled={isGeneratingPreset}
                  className="cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Vibrant & Bold
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setIsCreateOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Preset
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...presets].sort((a, b) => {
            // Sort favorites first, then by name
            if (a.favorite && !b.favorite) return -1;
            if (!a.favorite && b.favorite) return 1;
            return a.name.localeCompare(b.name);
          }).map((preset) => (
            <Card key={preset.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className="w-10 h-10 rounded-full shadow-sm flex-shrink-0"
                      style={{
                        background: `conic-gradient(from 0deg, ${hslToCss(preset.primary)} 0deg 72deg, ${hslToCss(preset.secondary)} 120deg 192deg, ${hslToCss(preset.accent)} 240deg 312deg, ${hslToCss(preset.primary)} 360deg)`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{preset.name}</p>
                      <p className="text-xs text-muted-foreground">ID: {preset.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleFavorite(preset)}
                      title={preset.favorite ? "Remove from favorites" : "Add to favorites"}
                      className={preset.favorite ? "text-red-500 hover:text-red-600" : ""}
                    >
                      <Heart 
                        className={`h-4 w-4 ${preset.favorite ? "fill-current" : ""}`} 
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleGenerateName(preset)}
                      disabled={generatingNameId === preset.id}
                      title="Generate name with AI"
                    >
                      {generatingNameId === preset.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDuplicate(preset)}
                      title="Duplicate preset"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingPreset(preset)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(preset.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PresetForm
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {editingPreset && (
        <PresetForm
          isOpen={!!editingPreset}
          onClose={() => setEditingPreset(null)}
          onSubmit={handleEdit}
          initialPreset={editingPreset}
          mode="edit"
        />
      )}

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This preset will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
