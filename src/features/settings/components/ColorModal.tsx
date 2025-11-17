"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { ColorPicker } from "./ColorPicker";

export interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initialColor?: {
    id: string;
    hex_value: string;
    name: string;
  };
  onSave: (color: { hex_value: string; name: string }) => void;
  userId: string;
  position?: { top: number; left: number } | null;
  defaultColor?: string; // Optional default color for create mode
}

export const ColorModal: React.FC<ColorModalProps> = ({
  isOpen,
  onClose,
  mode,
  initialColor,
  onSave,
  userId,
  position,
  defaultColor = "#3382c7",
}) => {
  const [colorValue, setColorValue] = useState(defaultColor);
  const [colorName, setColorName] = useState("");

  // Initialize values when modal opens or initialColor changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && initialColor) {
        setColorValue(initialColor.hex_value);
        setColorName(initialColor.name);
      } else {
        setColorValue(defaultColor);
        setColorName("");
      }
    }
  }, [isOpen, mode, initialColor, defaultColor]);

  const handleSave = () => {
    onSave({
      hex_value: colorValue,
      name: colorName.trim() || colorValue,
    });

    // Reset form
    setColorValue("#3382c7");
    setColorName("");
    onClose();
  };

  const handleCancel = () => {
    setColorValue("#3382c7");
    setColorName("");
    onClose();
  };

  if (!isOpen) return null;
  if (typeof window === "undefined") return null;

  // Determine if we should use positioned popup or centered modal
  const isPositioned = position !== null && position !== undefined;

  const renderModalContent = () => (
    <div className="space-y-5 relative">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold leading-none text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {mode === "create" ? "✨ Create Color" : "🎨 Edit Color"}
          </h4>
        </div>
        <p className="text-sm text-muted-foreground">
          {mode === "create" ? "Pick your perfect shade" : "Update your custom color"}
        </p>
      </div>

      {/* Reusable Color Picker Component */}
      <ColorPicker
        value={colorValue}
        onChange={setColorValue}
        name={colorName}
        onNameChange={setColorName}
        showNameInput={true}
      />

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 relative overflow-hidden group"
          style={{ backgroundColor: colorValue }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {mode === "create" ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Apply Color
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Save Changes
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        </button>
        <button
          onClick={handleCancel}
          className="px-4 py-2.5 text-sm font-medium border-2 border-border hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 hover:scale-105 active:scale-95 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const modalContent = (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999]",
          !isPositioned && "flex items-center justify-center"
        )}
        onClick={onClose}
      >
        {/* Centered modal (when not positioned) */}
        {!isPositioned && (
          <div
            className="bg-gradient-to-br from-card via-card to-card/95 border-2 border-primary/20 p-6 w-80 max-w-[90vw] shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ borderRadius: "var(--radius-large)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Decorative gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

            {/* Sparkle decoration */}
            <div className="absolute -top-1 -right-1 w-6 h-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-full animate-pulse opacity-50" />
              <svg
                className="w-6 h-6 text-primary absolute inset-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>

            {renderModalContent()}
          </div>
        )}
      </div>

      {/* Positioned modal (when position is provided) */}
      {isPositioned && (
        <div
          className="fixed bg-gradient-to-br from-card via-card to-card/95 border-2 border-primary/20 w-80 max-w-[90vw] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[10000]"
          style={{
            borderRadius: "var(--radius-large)",
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: "none",
            position: "fixed",
            height: "452px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decoration */}
          <div className="absolute -top-1 -right-1 w-6 h-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-full animate-pulse opacity-50" />
            <svg
              className="w-6 h-6 text-primary absolute inset-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>

          {/* Content container with exact padding */}
          <div className="p-6 relative z-10 h-full overflow-hidden">{renderModalContent()}</div>
        </div>
      )}
    </>
  );

  // Render modal in a portal at the body level to ensure proper fixed positioning
  return createPortal(modalContent, document.body);
};
