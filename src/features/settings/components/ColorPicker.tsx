"use client";

import React from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";

export interface ColorPickerProps {
  /** Current color value in hex format */
  value: string;
  /** Callback when color changes */
  onChange: (color: string) => void;
  /** Optional color name */
  name?: string;
  /** Callback when name changes */
  onNameChange?: (name: string) => void;
  /** Whether to show the name input */
  showNameInput?: boolean;
  /** Whether to show the name label (only applicable if showNameInput is true) */
  showNameLabel?: boolean;
  /** Additional className for container */
  className?: string;
  /** Placeholder for hex input */
  hexPlaceholder?: string;
  /** Placeholder for name input */
  namePlaceholder?: string;
}

/**
 * Reusable color picker component with hex input and optional name field.
 * Uses react-colorful for the color picker UI.
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  name = "",
  onNameChange,
  showNameInput = true,
  showNameLabel = true,
  className,
  hexPlaceholder = "#000000",
  namePlaceholder = "e.g., Ocean Blue, Sunset Orange...",
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Color Picker with gradient border */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-lg opacity-20 group-hover:opacity-30 blur transition duration-300" />
        <div className="relative p-3 rounded-lg border border-primary/10 bg-muted/30">
          <HexColorPicker color={value} onChange={onChange} className="w-full !h-36" />
        </div>
      </div>

      {/* Hex Input with color preview */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div
            className="w-12 h-12 rounded-lg border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: value }}
          />
          <div
            className="absolute inset-0 rounded-lg blur-md opacity-50 transition-opacity duration-300"
            style={{ backgroundColor: value }}
          />
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hexPlaceholder}
          className="flex-1 px-3 py-2.5 text-sm border-2 border-border bg-background/50 backdrop-blur-sm hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 font-mono font-medium"
          style={{ borderRadius: "var(--radius)" }}
        />
      </div>

      {/* Name Input */}
      {showNameInput && onNameChange && (
        <div className="space-y-2">
          {showNameLabel && (
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Color Name (Optional)
            </label>
          )}
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={namePlaceholder}
            className="w-full px-3 py-2.5 text-sm border-2 border-border bg-background/50 backdrop-blur-sm hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            style={{ borderRadius: "var(--radius)" }}
          />
        </div>
      )}
    </div>
  );
};
