"use client";

import { useSensors, useSensor, PointerSensor, KeyboardSensor, DragEndEvent } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { AlbumAudio } from "@/features/albums/types";
import type { UseAudioDragAndDropOptions, UseAudioDragAndDropReturn } from "../types";

export function useAudioDragAndDrop(
  options: UseAudioDragAndDropOptions
): UseAudioDragAndDropReturn {
  const { localAudios, setLocalAudios, albumId, onChange } = options;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
        delay: 0,
        tolerance: 0,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localAudios.findIndex((audio) => audio.id === active.id);
      const newIndex = localAudios.findIndex((audio) => audio.id === over.id);

      const reorderedAudios = arrayMove(localAudios, oldIndex, newIndex);
      // Update sort_order for all audios
      const updatedAudios = reorderedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));

      // Update local state immediately for responsive UI
      setLocalAudios(updatedAudios);
      onChange(updatedAudios);

      // Save to database immediately if album ID is available
      if (albumId && albumId !== "new" && albumId !== "temp") {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/audios", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              albumId: albumId,
              audios: updatedAudios
                .filter((audio) => !audio.id.startsWith("temp-")) // Only save real audios
                .map((audio) => ({
                  id: audio.id,
                  title: audio.title || null,
                  audio_url: audio.audio_url,
                  duration: audio.duration ?? null,
                  file_size: audio.file_size ?? null,
                  highlight_start_time: audio.highlight_start_time ?? null,
                  content_group: audio.content_group || null,
                  sort_order: audio.sort_order,
                })),
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            console.error("Error saving audio order:", error);
            toast.error("Failed to save audio order");
          }
        } catch (error: any) {
          console.error("Error saving audio order:", error);
          toast.error("Failed to save audio order");
        }
      }
    }
  };

  return {
    sensors,
    handleDragEnd,
  };
}
