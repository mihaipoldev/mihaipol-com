"use client";

import { useState, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { AudioTrackHeader } from "./AudioTrackHeader";
import { AudioTrackActions } from "./AudioTrackActions";
import { AudioTrackWaveform } from "./AudioTrackWaveform";
import { useAudioPlayback } from "./hooks/useAudioPlayback";
import { useLazyLoad } from "./hooks/useLazyLoad";
import type { AlbumAudio } from "@/features/albums/types";
import type { AudioTrackItemProps } from "./types";

export function AudioTrackItem({
  audio,
  onEdit,
  onDelete,
  onUpdate,
  onTitleUpdate,
  albumId,
}: AudioTrackItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: audio.id,
    disabled: audio.audio_url === "uploading",
  });
  const [isWaveformReady, setIsWaveformReady] = useState(false);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Use lazy load hook
  const { isVisible } = useLazyLoad({
    elementRef: cardRef,
    enabled: !!audio.audio_url && audio.audio_url !== "uploading",
  });

  // Use audio playback hook
  const { isPlaying, handlePlay, handlePause, handlePlayPause } = useAudioPlayback({
    wavesurfer: wavesurferRef.current,
    isWaveformReady,
    audioId: audio.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Handle waveform ready callback
  const handleWaveformReady = (wavesurfer: WaveSurfer) => {
    wavesurferRef.current = wavesurfer;
    setIsWaveformReady(true);
  };

  // Handle context menu for setting highlight
  const handleWaveformContextMenu = (e: React.MouseEvent & { calculatedTime?: number }) => {
    if (!wavesurferRef.current || !isWaveformReady || !waveformContainerRef.current) return;

    const clickTime = e.calculatedTime;
    if (clickTime === undefined) return;

    const updatedAudio: AlbumAudio = {
      ...audio,
      highlight_start_time: clickTime,
    };
    onUpdate(updatedAudio);
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        cardRef.current = node;
      }}
      style={style}
      className={cn(
        "relative rounded-xl bg-transparent py-0",
        "",
        isDragging && "shadow-lg opacity-50",
        audio.audio_url === "uploading" && "cursor-not-allowed"
      )}
    >
      {/* Top Section: Play button + Title + Upload date */}
      <AudioTrackHeader
        audio={audio}
        isPlaying={isPlaying}
        isWaveformReady={isWaveformReady}
        onPlayPause={handlePlayPause}
        onTitleUpdate={onTitleUpdate}
        albumId={albumId}
      />

      {/* Waveform Section with Duration */}
      <AudioTrackWaveform
        audio={audio}
        isVisible={isVisible}
        isWaveformReady={isWaveformReady}
        wavesurfer={wavesurferRef.current}
        waveformContainerRef={waveformContainerRef}
        onReady={handleWaveformReady}
        onPlay={handlePlay}
        onPause={handlePause}
        onContextMenu={handleWaveformContextMenu}
        onTimeChange={(time) => {
          const updatedAudio: AlbumAudio = {
            ...audio,
            highlight_start_time: time,
          };
          onUpdate(updatedAudio);
        }}
        onRemove={() => {
          const updatedAudio: AlbumAudio = {
            ...audio,
            highlight_start_time: null,
          };
          onUpdate(updatedAudio);
        }}
        onEdit={() => onEdit(audio)}
        dragHandleProps={{ attributes, listeners }}
      />

      {/* Action buttons below waveform */}
      <AudioTrackActions
        audio={{ id: audio.id, title: audio.title, audio_url: audio.audio_url }}
        onEdit={(partialAudio) => {
          // Find the full audio object and pass it to onEdit
          onEdit(audio);
        }}
        onDelete={onDelete}
      />
    </div>
  );
}
