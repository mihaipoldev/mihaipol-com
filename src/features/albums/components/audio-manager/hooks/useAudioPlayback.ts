"use client";

import { useState, useEffect, useRef } from "react";
import type WaveSurfer from "wavesurfer.js";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import type { UseAudioPlaybackOptions, UseAudioPlaybackReturn } from "../types";

export function useAudioPlayback(options: UseAudioPlaybackOptions): UseAudioPlaybackReturn {
  const { wavesurfer, isWaveformReady, audioId } = options;
  const { currentlyPlayingId, playAudio } = useAudioPlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Update ref when wavesurfer changes
  useEffect(() => {
    wavesurferRef.current = wavesurfer;
  }, [wavesurfer]);

  // Handle waveform play callback
  const handlePlay = () => {
    setIsPlaying(true);
    if (wavesurferRef.current) {
      // Register with audio player context when starting to play
      playAudio(audioId, () => {
        // Pause callback - called when another track starts playing
        if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
          wavesurferRef.current.pause();
        }
      });
    }
  };

  // Handle waveform pause callback
  const handlePause = () => {
    setIsPlaying(false);
  };

  // Effect to pause this track when another track starts playing
  useEffect(() => {
    if (currentlyPlayingId !== null && currentlyPlayingId !== audioId && wavesurferRef.current?.isPlaying()) {
      wavesurferRef.current.pause();
    }
  }, [currentlyPlayingId, audioId]);

  // Handle play/pause button click
  const handlePlayPause = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!wavesurferRef.current || !isWaveformReady) {
      console.warn("WaveSurfer not ready:", {
        hasInstance: !!wavesurferRef.current,
        isReady: isWaveformReady,
        audioId,
      });
      return;
    }
    try {
      const willPlay = !wavesurferRef.current.isPlaying();
      wavesurferRef.current.playPause();

      // Register with audio player context when starting to play
      if (willPlay) {
        playAudio(audioId, () => {
          // Pause callback - called when another track starts playing
          if (wavesurferRef.current && wavesurferRef.current.isPlaying()) {
            wavesurferRef.current.pause();
          }
        });
      }
    } catch (error) {
      console.error("Error playing/pausing audio:", error);
    }
  };

  return {
    isPlaying,
    handlePlay,
    handlePause,
    handlePlayPause,
  };
}
