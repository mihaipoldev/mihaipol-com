"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PresetColorPicker } from "./PresetColorPicker";
import type { LandingPagePreset } from "@/lib/landing-page-presets";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface PresetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (preset: Omit<LandingPagePreset, "id">) => Promise<void>;
  initialPreset?: LandingPagePreset;
  mode: "create" | "edit";
}

export function PresetForm({ isOpen, onClose, onSubmit, initialPreset, mode }: PresetFormProps) {
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("0 0% 50%");
  const [secondary, setSecondary] = useState("0 0% 50%");
  const [accent, setAccent] = useState("0 0% 50%");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialPreset) {
        setName(initialPreset.name);
        setPrimary(initialPreset.primary);
        setSecondary(initialPreset.secondary);
        setAccent(initialPreset.accent);
      } else {
        setName("");
        setPrimary("0 0% 50%");
        setSecondary("0 0% 50%");
        setAccent("0 0% 50%");
      }
    }
  }, [isOpen, mode, initialPreset]);

  const handleGeneratePreset = async () => {
    try {
      setIsGenerating(true);

      // Call AI API to generate complete preset
      const response = await fetch("/api/admin/ai/generate-preset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate preset");
      }

      const presetData = await response.json();

      // Fill form fields with generated data
      setName(presetData.name || "");
      setPrimary(presetData.primary || "0 0% 50%");
      setSecondary(presetData.secondary || "0 0% 50%");
      setAccent(presetData.accent || "0 0% 50%");

      toast.success("Preset generated! Review and save when ready.");
    } catch (error: any) {
      console.error("Error generating preset:", error);
      toast.error(error.message || "Failed to generate preset");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    // Validate HSL formats
    const hslRegex = /^\d+\s+\d+%\s+\d+%$/;
    if (!hslRegex.test(primary.trim()) || !hslRegex.test(secondary.trim()) || !hslRegex.test(accent.trim())) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        primary: primary.trim(),
        secondary: secondary.trim(),
        accent: accent.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error submitting preset:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Preset" : "Edit Preset"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="preset-name">Preset Name</Label>
            <Input
              id="preset-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              required
            />
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PresetColorPicker
              label="Primary Color"
              value={primary}
              onChange={setPrimary}
            />
            <PresetColorPicker
              label="Secondary Color"
              value={secondary}
              onChange={setSecondary}
            />
            <PresetColorPicker
              label="Accent Color"
              value={accent}
              onChange={setAccent}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-full shadow-sm flex-shrink-0"
                  style={{
                    background: `conic-gradient(from 0deg, hsl(${primary}) 0deg 72deg, hsl(${secondary}) 120deg 192deg, hsl(${accent}) 240deg 312deg, hsl(${primary}) 360deg)`,
                  }}
                />
                <div>
                  <p className="font-medium">{name || "Preset Name"}</p>
                  <p className="text-sm text-muted-foreground">
                    Primary: {primary} • Secondary: {secondary} • Accent: {accent}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : (
                mode === "create" ? "Create Preset" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
