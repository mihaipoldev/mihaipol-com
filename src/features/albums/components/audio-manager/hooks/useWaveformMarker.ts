"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type {
  UseWaveformMarkerOptions,
  UseWaveformMarkerReturn,
} from "../types";

/**
 * Custom hook for managing waveform marker drag behavior and position calculation
 * Handles dragging, position calculation, and database persistence
 */
export function useWaveformMarker(
  options: UseWaveformMarkerOptions
): UseWaveformMarkerReturn {
  const {
    highlightTime,
    waveformWidth,
    duration,
    isWaveformReady,
    audioId,
    onTimeChange,
    waveformContainerRef,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState<number | null>(null);
  const [savedHighlightTime, setSavedHighlightTime] = useState<number | null>(
    highlightTime
  );

  // Sync savedHighlightTime with prop changes (but only if not dragging)
  useEffect(() => {
    if (!isDragging && highlightTime !== savedHighlightTime) {
      setSavedHighlightTime(highlightTime);
    }
  }, [highlightTime, isDragging, savedHighlightTime]);

  // Calculate marker position based on highlight time
  const calculatePosition = (): number | null => {
    // Use dragPosition during drag, otherwise use savedHighlightTime
    const currentTime =
      isDragging && dragPosition !== null ? dragPosition : savedHighlightTime;

    if (!currentTime || !isWaveformReady || !duration || duration === 0) {
      return null;
    }

    if (!waveformWidth || waveformWidth === 0) {
      return null;
    }

    return (currentTime / duration) * waveformWidth;
  };

  const markerPosition = calculatePosition();

  // Handle marker drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isWaveformReady || !duration) return;

    setIsDragging(true);
    if (savedHighlightTime !== null) {
      setDragPosition(savedHighlightTime);
    }
  };

  // Handle marker drag move and end
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!waveformContainerRef.current) return;

      const rect = waveformContainerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const currentWidth = rect.width;

      if (!duration || currentWidth === 0) return;

      // Clamp to waveform bounds
      const clampedX = Math.max(0, Math.min(currentWidth, mouseX));
      const newTime = (clampedX / currentWidth) * duration;

      setDragPosition(newTime);
    };

    const handleMouseUp = async () => {
      const currentPosition = dragPosition;
      setIsDragging(false);

      // Update highlight_start_time on release
      if (isWaveformReady && currentPosition !== null && duration) {
        // Update local saved state immediately to prevent jumping
        setSavedHighlightTime(currentPosition);
        setDragPosition(null);

        // Notify parent of change
        onTimeChange(currentPosition);

        // Save to Supabase if audio has a real ID (not temp)
        if (audioId && !audioId.startsWith("temp-")) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const accessToken = sessionData?.session?.access_token;

            const response = await fetch("/api/admin/albums/audios", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(accessToken
                  ? { Authorization: `Bearer ${accessToken}` }
                  : {}),
              },
              body: JSON.stringify({
                id: audioId,
                highlight_start_time: currentPosition,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(
                error.error || "Failed to save highlight start time"
              );
            }

            // After successful save, update savedHighlightTime to match database
            setSavedHighlightTime(currentPosition);
          } catch (error: any) {
            console.error("Error saving highlight start time:", error);
            toast.error(
              error.message || "Failed to save highlight start time"
            );
            // Revert to previous value on error
            setSavedHighlightTime(highlightTime);
          }
        } else {
          // For temp items, just clear drag position
          setDragPosition(null);
        }
      } else {
        setDragPosition(null);
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    dragPosition,
    isWaveformReady,
    audioId,
    savedHighlightTime,
    onTimeChange,
    duration,
    highlightTime,
    waveformContainerRef,
  ]);

  return {
    markerPosition,
    isDragging,
    handleMouseDown,
  };
}
