"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  titleIcon?: React.ReactNode | string; // ReactNode for icons/components, string for image URLs
  headerActions?: React.ReactNode; // Actions to display in the header (e.g., publish status switch)
  footer?: React.ReactNode; // Footer content to display at the bottom
  children: React.ReactNode;
  contentClassName?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "6xl" | "7xl" | "full";
  maxHeight?: "none" | "90vh";
  showScroll?: boolean;
}

const maxWidthMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "4xl": "max-w-4xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export function ModalShell({
  open,
  onOpenChange,
  title,
  description,
  titleIcon,
  headerActions,
  footer,
  children,
  contentClassName,
  maxWidth = "lg",
  maxHeight = "none",
  showScroll = false,
}: ModalShellProps) {
  const maxWidthClass = maxWidthMap[maxWidth];
  const maxHeightClass = maxHeight === "90vh" ? "max-h-[90vh]" : "";

  // Render title icon/image
  const renderTitleIcon = () => {
    if (!titleIcon) return null;
    
    // If it's a string, treat it as an image URL (no rotation for DB icons)
    if (typeof titleIcon === "string") {
      return (
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img
            src={titleIcon}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      );
    }
    
    // Otherwise, render as ReactNode (FontAwesome icon or other) with proper container styling and animation
    return (
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary text-background flex items-center justify-center flex-shrink-0"
      >
        {titleIcon}
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          maxWidthClass,
          maxHeightClass,
          "p-0 gap-0 [&>button]:z-20",
          contentClassName
        )}
        style={{
          boxShadow: "0 20px 60px -12px hsl(var(--primary) / 0.3)",
        }}
      >
        <div className={cn(
          "flex flex-col",
          maxHeight === "90vh" ? "max-h-[90vh] overflow-hidden" : ""
        )}>
          <div className="flex-shrink-0 p-4 md:p-6 border-b border-border/50 sticky top-0 z-10 bg-background rounded-t-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {renderTitleIcon()}
                <div className="min-w-0 flex-1">
                  <DialogTitle 
                    className="text-lg md:text-2xl font-bold leading-tight inline-block"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.5))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {title}
                  </DialogTitle>
                  {description && (
                    <DialogDescription className="text-xs md:text-sm text-muted-foreground/50 mt-0">
                      {description}
                    </DialogDescription>
                  )}
                </div>
              </div>
              {headerActions && (
                <div className="flex items-center gap-3 shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
          </div>
          <div className={cn(
            showScroll ? "flex-1 min-h-0 overflow-y-auto" : "",
            "p-4 md:p-6"
          )}>
            {children}
          </div>
          {footer && (
            <div className="flex-shrink-0 p-4 md:p-6 border-t border-border/50 sticky bottom-0 z-10 bg-background rounded-b-lg">
              {footer}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
