"use client";

import { GripVertical } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import { WaveformMarker } from "./WaveformMarker";
import type { AudioTrackWaveformProps } from "./types";

export function AudioTrackWaveform({
  audio,
  isVisible,
  isWaveformReady,
  wavesurfer,
  waveformContainerRef,
  onReady,
  onPlay,
  onPause,
  onContextMenu,
  onTimeChange,
  onRemove,
  onEdit,
  dragHandleProps,
}: AudioTrackWaveformProps) {
  if (!audio.audio_url || audio.audio_url === "uploading") {
    return null;
  }

  return (
    <div className="px-4 pb-0 relative z-10">
      <div className="relative flex items-center gap-2">
        {/* Drag Handle - Left of waveform */}
        <div
          {...dragHandleProps.attributes}
          {...dragHandleProps.listeners}
          className="flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <GripVertical className="h-5 w-5" />
        </div>
        {/* Waveform container - flex-1 to take available space */}
        <div ref={waveformContainerRef} className="flex-1 relative pointer-events-auto">
          <WaveformPlayer
            audioUrl={audio.audio_url}
            waveformPeaks={audio.waveform_peaks}
            duration={audio.duration}
            audioId={audio.id}
            isVisible={isVisible}
            onReady={onReady}
            onPlay={onPlay}
            onPause={onPause}
            onContextMenu={onContextMenu}
          />
          {/* Highlight Marker */}
          {isWaveformReady && wavesurfer && waveformContainerRef.current && (
            <WaveformMarker
              highlightTime={audio.highlight_start_time}
              waveformWidth={waveformContainerRef.current.offsetWidth}
              duration={wavesurfer.getDuration()}
              isWaveformReady={isWaveformReady}
              audioId={audio.id}
              waveformContainerRef={waveformContainerRef}
              onTimeChange={onTimeChange}
              onRemove={onRemove}
              onEdit={onEdit}
            />
          )}
        </div>
      </div>
    </div>
  );
}
