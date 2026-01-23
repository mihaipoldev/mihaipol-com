"use client";

import { useState, useEffect, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hslToHex, hexToHsl } from "@/lib/colorUtils";
import { cn } from "@/lib/utils";

interface PresetColorPickerProps {
  label: string;
  value: string; // HSL format: "h s% l%" (stored in DB)
  onChange: (hsl: string) => void; // Always returns HSL format
  className?: string;
}

/**
 * Convert HSL string to hex for color picker
 */
function hslToHexFromString(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  const h = parseInt(parts[0], 10);
  const s = parseInt(parts[1].replace("%", ""), 10);
  const l = parseInt(parts[2].replace("%", ""), 10);
  return hslToHex(h, s, l);
}

/**
 * Convert hex to HSL string format
 */
function hexToHslString(hex: string): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return "0 0% 50%";
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

/**
 * Normalize HSL string for comparison (handles rounding differences)
 */
function normalizeHsl(hsl: string): string {
  const parts = hsl.trim().split(/\s+/);
  const h = parseInt(parts[0], 10);
  const s = parseInt(parts[1].replace("%", ""), 10);
  const l = parseInt(parts[2].replace("%", ""), 10);
  return `${h} ${s}% ${l}%`;
}

/**
 * Validate hex color format
 */
function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

export function PresetColorPicker({ label, value, onChange, className }: PresetColorPickerProps) {
  const [hexValue, setHexValue] = useState(() => hslToHexFromString(value));
  const lastProcessedHslRef = useRef<string>(value);
  const lastSentHslRef = useRef<string | null>(null);

  // Update hex value when HSL value prop changes (e.g., when editing existing preset)
  // Only update if the value changed from outside (not from our own onChange)
  useEffect(() => {
    // Normalize both values for comparison to handle rounding differences
    const normalizedValue = normalizeHsl(value);
    const normalizedLastSent = lastSentHslRef.current ? normalizeHsl(lastSentHslRef.current) : null;
    const normalizedLastProcessed = normalizeHsl(lastProcessedHslRef.current);

    // Skip if this is the value we just sent (to prevent loops)
    if (normalizedValue === normalizedLastSent) {
      lastSentHslRef.current = null; // Reset after recognizing our own change
      return;
    }

    // Skip if we've already processed this value
    if (normalizedValue === normalizedLastProcessed) {
      return;
    }

    // Update the hex value and track that we've processed this HSL value
    const newHex = hslToHexFromString(value);
    setHexValue((prevHex) => {
      // Only update if the hex actually changed
      if (prevHex !== newHex) {
        lastProcessedHslRef.current = value;
        return newHex;
      }
      return prevHex;
    });
  }, [value]);

  const handleHexChange = (hex: string) => {
    // Skip if this is the same hex value (prevent unnecessary updates)
    if (hex === hexValue) {
      return;
    }

    setHexValue(hex);
    // Convert HEX to HSL and call onChange with HSL format
    const hslString = hexToHslString(hex);
    lastSentHslRef.current = hslString; // Track what we're sending
    onChange(hslString);
  };

  const handleHexInputChange = (input: string) => {
    // Add # if missing
    const hex = input.startsWith("#") ? input : `#${input}`;
    
    if (isValidHex(hex)) {
      // Skip if this is the same hex value
      if (hex === hexValue) {
        return;
      }

      setHexValue(hex);
      const hslString = hexToHslString(hex);
      lastSentHslRef.current = hslString; // Track what we're sending
      onChange(hslString);
    } else if (hex.length <= 7) {
      // Allow typing, update hex value but don't convert yet
      setHexValue(hex);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">{label}</Label>
      
      {/* Color Picker */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-lg opacity-20 group-hover:opacity-30 blur transition duration-300" />
        <div className="relative p-3 rounded-lg border border-primary/10 bg-muted/30">
          <HexColorPicker color={hexValue} onChange={handleHexChange} className="w-full !h-36" />
        </div>
      </div>

      {/* Color Preview and HEX Input */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div
            className="w-12 h-12 rounded-lg border-2 border-white shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: hexValue }}
          />
          <div
            className="absolute inset-0 rounded-lg blur-md opacity-50 transition-opacity duration-300"
            style={{ backgroundColor: hexValue }}
          />
        </div>
        
        {/* HEX Input */}
        <div className="flex-1 space-y-1">
          <Input
            value={hexValue}
            onChange={(e) => handleHexInputChange(e.target.value)}
            placeholder="#000000"
            className="font-mono text-sm uppercase"
            maxLength={7}
          />
          <p className="text-xs text-muted-foreground">HEX color</p>
        </div>
      </div>
    </div>
  );
}
