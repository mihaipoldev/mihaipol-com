"use client";

import { useRef, useEffect } from "react";
import { Pencil, X } from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useWaveformMarker } from "./hooks/useWaveformMarker";
import type { WaveformMarkerProps } from "./types";

export function WaveformMarker({
  highlightTime,
  waveformWidth,
  duration,
  isWaveformReady,
  audioId,
  onTimeChange,
  onRemove,
  onEdit,
  waveformContainerRef,
  className,
}: WaveformMarkerProps) {
  const markerContextMenuEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(
    null
  );

  const { markerPosition, isDragging, handleMouseDown } = useWaveformMarker({
    highlightTime,
    waveformWidth,
    duration,
    isWaveformReady,
    audioId,
    onTimeChange,
    waveformContainerRef,
  });

  // Handle waveform resize to recalculate marker position
  useEffect(() => {
    if (!waveformContainerRef.current || !isWaveformReady) return;

    const resizeObserver = new ResizeObserver(() => {
      // Force re-render to recalculate marker position
      // This is handled by useWaveformMarker which reads current dimensions
    });

    resizeObserver.observe(waveformContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isWaveformReady, waveformContainerRef]);

  // Handle marker context menu
  const handleMarkerContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    markerContextMenuEventRef.current = e;
  };

  const handleMarkerContextMenuOpenChange = (open: boolean) => {
    if (!open) {
      markerContextMenuEventRef.current = null;
    }
  };

  // Don't render if no position can be calculated
  if (markerPosition === null) return null;

  return (
    <ContextMenu onOpenChange={handleMarkerContextMenuOpenChange}>
      <ContextMenuTrigger asChild>
        <div
          onMouseDown={handleMouseDown}
          onContextMenu={handleMarkerContextMenu}
          className={cn(
            "absolute z-10 transition-all duration-200",
            "cursor-grab active:cursor-grabbing",
            "hover:scale-110",
            isDragging && "scale-110 opacity-100 cursor-grabbing",
            className
          )}
          style={{
            left: `${markerPosition}px`,
            bottom: "-12px",
            transform: `translateX(-50%)`,
          }}
        >
          <div className="flex flex-col-reverse items-center">
            {/* Triangle pointing up (corner at top, base at bottom) */}
            <div
              className={cn(
                "w-0 h-0 transition-all duration-200",
                "border-l-[7px] border-r-[7px] border-b-[10px]",
                "border-l-transparent border-r-transparent",
                "border-b-slate-300 dark:border-b-primary/80",
                "hover:border-b-primary dark:hover:border-b-primary",
                isDragging && "border-b-primary dark:border-b-primary"
              )}
              style={{
                filter: isDragging
                  ? "drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))"
                  : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15))",
              }}
            />
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent
        className="px-0 py-2 border-0 w-48 bg-foreground"
        style={{
          boxShadow:
            "rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px",
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <ContextMenuItem
          onClick={onEdit}
          className="cursor-pointer !rounded-none px-4 py-2"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          onClick={onRemove}
          className="cursor-pointer !rounded-none px-4 py-2 text-destructive focus:text-destructive"
        >
          <X className="mr-2 h-4 w-4" />
          Remove highlight
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
