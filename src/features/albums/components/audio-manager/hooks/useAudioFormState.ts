"use client";

import { useState, useCallback } from "react";
import type { AlbumAudio } from "@/features/albums/types";
import type { UseAudioFormStateOptions, UseAudioFormStateReturn } from "../types";

export function useAudioFormState(
  options: UseAudioFormStateOptions
): UseAudioFormStateReturn {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAudio, setEditingAudio] = useState<AlbumAudio | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAudioUrl, setEditAudioUrl] = useState<string | null>(null);
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [editDuration, setEditDuration] = useState<number | null>(null);
  const [editFileSize, setEditFileSize] = useState<number | null>(null);
  const [editHighlightStartTime, setEditHighlightStartTime] = useState<string>("");
  const [editContentGroup, setEditContentGroup] = useState<string>("");
  const [editIsPublic, setEditIsPublic] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = useCallback(() => {
    setEditingAudio(null);
    setEditTitle("");
    setEditAudioUrl(null);
    setEditDuration(null);
    setEditFileSize(null);
    setEditHighlightStartTime("");
    setEditContentGroup("");
    setEditIsPublic(false);
    setEditSelectedFile(null);
  }, []);

  const initializeForm = useCallback((audio: AlbumAudio) => {
    setEditingAudio(audio);
    setEditTitle(audio.title || "");
    setEditAudioUrl(audio.audio_url);
    setEditDuration(audio.duration);
    setEditFileSize(audio.file_size);
    setEditHighlightStartTime(audio.highlight_start_time?.toString() || "");
    setEditContentGroup(audio.content_group || "");
    setEditIsPublic(audio.is_public ?? false);
    setEditSelectedFile(null);
  }, []);

  const openModal = useCallback(() => {
    setIsEditModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    resetForm();
  }, [resetForm]);

  return {
    // State
    isEditModalOpen,
    editingAudio,
    editTitle,
    editAudioUrl,
    editSelectedFile,
    editDuration,
    editFileSize,
    editHighlightStartTime,
    editContentGroup,
    editIsPublic,
    isUploading,
    // Setters
    setIsEditModalOpen,
    setEditingAudio,
    setEditTitle,
    setEditAudioUrl,
    setEditSelectedFile,
    setEditDuration,
    setEditFileSize,
    setEditHighlightStartTime,
    setEditContentGroup,
    setEditIsPublic,
    setIsUploading,
    // Helpers
    resetForm,
    initializeForm,
    openModal,
    closeModal,
  };
}
