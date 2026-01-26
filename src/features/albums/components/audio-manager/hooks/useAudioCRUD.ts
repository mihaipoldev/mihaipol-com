"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { AlbumAudio } from "@/features/albums/types";
import type { UseAudioCRUDOptions, UseAudioCRUDReturn } from "../types";

export function useAudioCRUD(options: UseAudioCRUDOptions): UseAudioCRUDReturn {
  const {
    localAudios,
    setLocalAudios,
    albumId,
    folderPath,
    onChange,
    formState,
  } = options;

  const [audioToDelete, setAudioToDelete] = useState<AlbumAudio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string) => {
    const audio = localAudios.find((a) => a.id === id);
    if (audio) {
      setAudioToDelete(audio);
    }
  };

  const confirmDelete = async () => {
    if (!audioToDelete) return;

    // Skip API call for temporary/optimistic items (they're not in the database yet)
    if (audioToDelete.id.startsWith("temp-")) {
      const updatedAudios = localAudios.filter((audio) => audio.id !== audioToDelete.id);
      const reorderedAudios = updatedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));
      setLocalAudios(reorderedAudios);
      onChange(reorderedAudios);
      setAudioToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/albums/audios?id=${audioToDelete.id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete audio");
      }

      // Remove from local state after successful deletion
      const updatedAudios = localAudios.filter((audio) => audio.id !== audioToDelete.id);
      // Recalculate sort_order after deletion
      const reorderedAudios = updatedAudios.map((audio, index) => ({
        ...audio,
        sort_order: index,
      }));
      setLocalAudios(reorderedAudios);
      onChange(reorderedAudios);

      toast.success("Audio deleted successfully");
      setAudioToDelete(null);
    } catch (error: any) {
      console.error("Error deleting audio:", error);
      toast.error(error.message || "Failed to delete audio");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    const {
      editingAudio,
      editTitle,
      editAudioUrl,
      editSelectedFile,
      editDuration,
      editFileSize,
      editHighlightStartTime,
      editContentGroup,
      editIsPublic,
      setIsUploading,
      setIsEditModalOpen,
      resetForm,
    } = formState;

    if (!editAudioUrl && !editSelectedFile) {
      alert("Please select an audio file");
      return; // Need either URL or file
    }

    // Parse highlight start time
    const highlightStartTime = editHighlightStartTime.trim()
      ? parseFloat(editHighlightStartTime)
      : null;

    let tempAudioId: string | null = null;
    let optimisticAudios: AlbumAudio[] | null = null;

    // If uploading a new file, do optimistic update
    if (editSelectedFile && !editingAudio) {
      setIsUploading(true);
      // Create temporary audio item immediately
      tempAudioId = `temp-${Date.now()}`;
      const optimisticAudio: AlbumAudio = {
        id: tempAudioId!,
        album_id: "", // Will be set by parent
        title: editTitle || null,
        audio_url: "uploading", // Special marker for uploading state
        duration: editDuration,
        file_size: editFileSize || editSelectedFile.size,
        highlight_start_time: highlightStartTime,
        content_group: editContentGroup.trim() || null,
        is_public: editIsPublic,
        sort_order: localAudios.length,
      };
      optimisticAudios = [...localAudios, optimisticAudio];
      setLocalAudios(optimisticAudios);
      // Notify parent after state update
      onChange(optimisticAudios);
      // Close modal immediately for better UX
      setIsEditModalOpen(false);
    }

    let finalAudioUrl = editAudioUrl;
    let finalDuration = editDuration;
    let finalFileSize = editFileSize;

    // Upload file if selected
    if (editSelectedFile) {
      try {
        const formData = new FormData();
        formData.append("file", editSelectedFile);
        formData.append("folderPath", folderPath);
        const uploadResponse = await fetch("/api/admin/upload/audio", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload audio");
        }
        const uploadData = await uploadResponse.json();
        finalAudioUrl = uploadData.url;
        // Use metadata from upload response if available, otherwise keep client-side extracted values
        if (uploadData.duration !== undefined && uploadData.duration !== null) {
          finalDuration = uploadData.duration;
        }
        if (uploadData.fileSize !== undefined && uploadData.fileSize !== null) {
          finalFileSize = uploadData.fileSize;
        }
        // Always ensure we have file size from the file itself as fallback
        if (finalFileSize === null || finalFileSize === undefined) {
          finalFileSize = editSelectedFile.size;
        }
      } catch (uploadError: any) {
        console.error("Error uploading audio:", uploadError);
        // Remove optimistic update on error
        if (tempAudioId && optimisticAudios) {
          const updatedAudios = optimisticAudios.filter((audio) => audio.id !== tempAudioId);
          setLocalAudios(updatedAudios);
          onChange(updatedAudios);
        }
        setIsUploading(false);
        alert(uploadError.message || "Failed to upload audio");
        setIsEditModalOpen(true); // Reopen modal on error
        return;
      }
    }

    if (!finalAudioUrl) {
      // Remove optimistic update on error
      if (tempAudioId && optimisticAudios) {
        const updatedAudios = optimisticAudios.filter((audio) => audio.id !== tempAudioId);
        setLocalAudios(updatedAudios);
        onChange(updatedAudios);
      }
      setIsUploading(false);
      alert("Failed to get audio URL");
      setIsEditModalOpen(true); // Reopen modal on error
      return;
    }

    if (editingAudio) {
      // Update existing audio - save to database immediately if it has a real ID
      if (editingAudio.id && !editingAudio.id.startsWith("temp-")) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;

          const response = await fetch("/api/admin/albums/audios", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: JSON.stringify({
              id: editingAudio.id,
              title: editTitle || null,
              audio_url: finalAudioUrl!,
              duration: finalDuration,
              file_size: finalFileSize,
              highlight_start_time: highlightStartTime,
              content_group: editContentGroup.trim() || null,
              is_public: editIsPublic,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to update audio");
          }

          const updatedAudioData = await response.json();

          // Update local state with response data
          const updatedAudios = localAudios.map((audio) =>
            audio.id === editingAudio.id
              ? {
                  ...updatedAudioData,
                  // Preserve any local state
                  title: editTitle || null,
                  audio_url: finalAudioUrl!,
                  duration: finalDuration,
                  file_size: finalFileSize,
                  highlight_start_time: highlightStartTime,
                  content_group: editContentGroup.trim() || null,
                  is_public: editIsPublic,
                }
              : audio
          );
          setLocalAudios(updatedAudios);
          onChange(updatedAudios);
          toast.success("Audio updated successfully");
        } catch (updateError: any) {
          console.error("Error updating audio:", updateError);
          toast.error(updateError.message || "Failed to update audio");
          setIsEditModalOpen(true); // Keep modal open on error
          return;
        }
      } else {
        // Temporary audio - just update local state
        const updatedAudios = localAudios.map((audio) =>
          audio.id === editingAudio.id
            ? {
                ...audio,
                title: editTitle || null,
                audio_url: finalAudioUrl!,
                duration: finalDuration,
                file_size: finalFileSize,
                highlight_start_time: highlightStartTime,
                content_group: editContentGroup.trim() || null,
                is_public: editIsPublic,
              }
            : audio
        );
        setLocalAudios(updatedAudios);
        onChange(updatedAudios);
      }
      // Reset and close
      setIsEditModalOpen(false);
      resetForm();
    } else {
      // Create new audio - save to database immediately if album ID is available
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
              album_id: albumId,
              title: editTitle || null,
              audio_url: finalAudioUrl!,
              duration: finalDuration,
              file_size: finalFileSize,
              highlight_start_time: highlightStartTime,
              content_group: editContentGroup.trim() || null,
              is_public: editIsPublic,
              sort_order: localAudios.length,
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to create audio");
          }

          const createdAudio = await response.json();

          // Update the optimistic audio with real database data
          // Use optimisticAudios if available, otherwise fall back to localAudios
          const currentAudios = optimisticAudios || localAudios;
          const updatedAudios = currentAudios.map((audio) =>
            audio.id === tempAudioId
              ? {
                  ...createdAudio,
                  // Preserve any local state that might not be in the response
                  title: editTitle || null,
                  audio_url: finalAudioUrl!,
                  duration: finalDuration,
                  file_size: finalFileSize,
                  highlight_start_time: highlightStartTime,
                  content_group: editContentGroup.trim() || null,
                  is_public: editIsPublic,
                }
              : audio
          );
          setLocalAudios(updatedAudios);
          // Notify parent of the update
          onChange(updatedAudios);

          toast.success("Audio added successfully");
        } catch (createError: any) {
          console.error("Error creating audio:", createError);
          // Remove optimistic update on error
          if (tempAudioId && optimisticAudios) {
            const updatedAudios = optimisticAudios.filter((audio) => audio.id !== tempAudioId);
            setLocalAudios(updatedAudios);
            onChange(updatedAudios);
          }
          setIsUploading(false);
          toast.error(createError.message || "Failed to create audio");
          setIsEditModalOpen(true); // Reopen modal on error
          return;
        }
      } else {
        // No album ID yet (new album) - just update local state
        // Use optimisticAudios if available, otherwise fall back to localAudios
        const currentAudios = optimisticAudios || localAudios;
        const updatedAudios = currentAudios.map((audio) =>
          audio.id === tempAudioId
            ? {
                ...audio,
                title: editTitle || null,
                audio_url: finalAudioUrl!,
                duration: finalDuration,
                file_size: finalFileSize,
                highlight_start_time: highlightStartTime,
                content_group: editContentGroup.trim() || null,
                is_public: editIsPublic,
              }
            : audio
        );
        setLocalAudios(updatedAudios);
        // Notify parent of the update
        onChange(updatedAudios);
      }
      setIsUploading(false);
      // Reset form state
      resetForm();
    }
  };

  return {
    audioToDelete,
    setAudioToDelete,
    isDeleting,
    handleDelete,
    confirmDelete,
    handleSave,
  };
}
