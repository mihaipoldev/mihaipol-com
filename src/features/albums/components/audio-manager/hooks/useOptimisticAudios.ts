"use client";

import { useState, useEffect } from "react";
import type { AlbumAudio } from "@/features/albums/types";
import type { UseOptimisticAudiosOptions, UseOptimisticAudiosReturn } from "../types";

export function useOptimisticAudios(
  options: UseOptimisticAudiosOptions
): UseOptimisticAudiosReturn {
  const { audios } = options;

  const [localAudios, setLocalAudios] = useState<AlbumAudio[]>(() =>
    [...audios].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  );

  // Sync local audios when prop changes (but don't overwrite optimistic updates)
  useEffect(() => {
    setLocalAudios((current) => {
      // If we have optimistic updates (items with audio_url === "uploading"), preserve them
      const optimisticItems = current.filter((audio) => audio.audio_url === "uploading");
      const propItems = [...audios].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      // Merge: keep optimistic items, add/update prop items
      const merged = [...propItems];
      optimisticItems.forEach((optimistic) => {
        const existingIndex = merged.findIndex((a) => a.id === optimistic.id);
        if (existingIndex >= 0) {
          merged[existingIndex] = optimistic; // Keep optimistic version
        } else {
          merged.push(optimistic); // Add optimistic item
        }
      });

      return merged.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    });
  }, [audios]);

  return {
    localAudios,
    setLocalAudios,
  };
}
