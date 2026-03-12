"use client";

import { useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { Loader2, Star } from "lucide-react";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { useWaveform } from "./hooks/useWaveform";
import { formatDuration } from "./utils/formatDuration";
import { WAVEFORM_CONFIG } from "./utils/waveformConfig";
import type { WaveformPlayerProps } from "./types";

export function WaveformPlayer({
  audioUrl,
  waveformPeaks,
  duration,
  audioId,
  isVisible,
  onReady,
  onPlay,
  onPause,
  onSeek,
  onContextMenu,
  className,
  showDuration = true,
}: WaveformPlayerProps) {
  const { theme, resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastContextMenuEventRef = useRef<React.MouseEvent<HTMLDivElement> | null>(null);
  const onReadyCalledRef = useRef(false);

  const { wavesurfer, isReady, isPlaying } = useWaveform({
    audioUrl,
    waveformPeaks,
    audioId,
    containerRef,
    isVisible,
    theme,
    resolvedTheme,
  });

  // Notify parent when waveform is ready (only once)
  useEffect(() => {
    if (wavesurfer && isReady && onReady && !onReadyCalledRef.current) {
      onReadyCalledRef.current = true;
      onReady(wavesurfer);
    }
    // Reset when waveform changes (new audio loaded)
    if (!wavesurfer || !isReady) {
      onReadyCalledRef.current = false;
    }
  }, [wavesurfer, isReady, onReady]);

  // Notify parent of play/pause events - use refs to avoid including callbacks in deps,
  // which would cause infinite loop when parent re-renders (e.g. on highlight update)
  const onPlayRef = useRef(onPlay);
  const onPauseRef = useRef(onPause);
  onPlayRef.current = onPlay;
  onPauseRef.current = onPause;

  useEffect(() => {
    if (isPlaying && onPlayRef.current) {
      onPlayRef.current();
    } else if (!isPlaying && onPauseRef.current) {
      onPauseRef.current();
    }
  }, [isPlaying]);

  const handleContextMenuOpenChange = (open: boolean) => {
    // When menu closes without selection, clear the stored event
    if (!open) {
      lastContextMenuEventRef.current = null;
    }
  };

  const handleContextMenuTrigger = (e: React.MouseEvent<HTMLDivElement>) => {
    // Store the event so we can calculate the time when the menu item is clicked
    lastContextMenuEventRef.current = e;
    if (onContextMenu) {
      onContextMenu(e);
    }
  };

  const handleSetHighlight = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!wavesurfer || !isReady || !containerRef.current || !lastContextMenuEventRef.current) return;

    // Calculate time from the stored right-click event
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = lastContextMenuEventRef.current.clientX - rect.left;

    const audioDuration = wavesurfer.getDuration();
    if (!audioDuration) return;

    const clickTime = Math.max(0, Math.min(audioDuration, (clickX / rect.width) * audioDuration));

    // Call onContextMenu with the calculated time
    // The parent component will handle updating the highlight_start_time
    if (onContextMenu) {
      // Create a synthetic event with the calculated time
      const syntheticEvent = {
        ...lastContextMenuEventRef.current,
        calculatedTime: clickTime,
      } as React.MouseEvent & { calculatedTime: number };
      onContextMenu(syntheticEvent as any);
    }

    // Clear the stored event
    lastContextMenuEventRef.current = null;
  };

  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle seeking when playing
    // When stopped, the overlay will handle play
    if (isPlaying && isReady && wavesurfer && e.button === 0) {
      // Store initial mouse position to detect if it's a drag (scroll) vs click (seek)
      mouseDownRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // If mouse moves significantly, it's likely a scroll/drag, not a seek
    if (mouseDownRef.current) {
      const deltaX = Math.abs(e.clientX - mouseDownRef.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownRef.current.y);
      
      // If vertical movement is greater than horizontal, it's a scroll - clear the ref
      if (deltaY > deltaX && deltaY > 5) {
        mouseDownRef.current = null;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only seek if it was a click (not a drag/scroll) and we're playing
    if (
      mouseDownRef.current &&
      isPlaying &&
      isReady &&
      wavesurfer &&
      e.button === 0
    ) {
      const deltaX = Math.abs(e.clientX - mouseDownRef.current.x);
      const deltaY = Math.abs(e.clientY - mouseDownRef.current.y);
      const deltaTime = Date.now() - mouseDownRef.current.time;
      
      // Only seek if it was a click (small movement, short duration)
      if (deltaX < 5 && deltaY < 5 && deltaTime < 300) {
        const waveform = e.currentTarget;
        const rect = waveform.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const normalizedX = Math.max(0, Math.min(1, clickX / rect.width));

        console.log("[Waveform Debug] Seeking on mouseUp:", {
          audioId,
          clickX,
          width: rect.width,
          normalizedX,
          seekToTime: `${Math.floor(normalizedX * wavesurfer.getDuration())}s`,
        });

        wavesurfer.seekTo(normalizedX);
        if (onSeek) {
          onSeek(normalizedX);
        }
      }
    }
    
    // Clear the ref
    mouseDownRef.current = null;
  };

  const handlePlayOverlayClick = (e: React.MouseEvent) => {
    console.log("[Waveform Debug] Overlay onClick (stopped):", {
      audioId,
      isPlaying,
      isReady,
    });
    e.stopPropagation();
    if (wavesurfer && isReady) {
      wavesurfer.playPause();
    }
  };

  const handlePlayOverlayMouseDown = (e: React.MouseEvent) => {
    console.log("[Waveform Debug] Overlay onMouseDown (stopped):", {
      audioId,
      isPlaying,
      isReady,
    });
    e.stopPropagation();
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      {/* Waveform container - flex-1 to take available space */}
      <div className="flex-1 relative pointer-events-auto">
        <ContextMenu onOpenChange={handleContextMenuOpenChange}>
          <ContextMenuTrigger asChild>
            <div
              ref={containerRef}
              className="w-full rounded overflow-hidden cursor-pointer"
              style={{ minHeight: `${WAVEFORM_CONFIG.height}px` }}
              onContextMenu={handleContextMenuTrigger}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            />
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
              onClick={handleSetHighlight}
              className="cursor-pointer !rounded-none px-4 py-2"
            >
              <Star className="mr-2 h-4 w-4" />
              Set to highlight
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded pointer-events-none">
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
          </div>
        )}
        {/* Transparent overlay when stopped - acts as play button */}
        {isReady && !isPlaying && (
          <div
            className="absolute inset-0 cursor-pointer z-20"
            onClick={handlePlayOverlayClick}
            onMouseDown={handlePlayOverlayMouseDown}
            aria-label="Play audio"
          />
        )}
      </div>

      {/* Duration on the right of waveform */}
      {showDuration && duration !== null && (
        <div className="text-xs text-muted-foreground flex-shrink-0">
          {formatDuration(duration)}
        </div>
      )}
    </div>
  );
}
