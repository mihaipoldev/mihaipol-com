"use client";

import { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/lib/supabase";
import { WAVEFORM_CONFIG, getWaveformColors } from "../utils/waveformConfig";
import type { UseWaveformOptions, UseWaveformReturn } from "../types";

/**
 * Custom hook for managing WaveSurfer instance lifecycle
 * Handles initialization, peak extraction, event handling, and cleanup
 */
export function useWaveform(options: UseWaveformOptions): UseWaveformReturn {
  const {
    audioUrl,
    waveformPeaks,
    audioId,
    containerRef,
    isVisible,
    theme,
    resolvedTheme,
  } = options;

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const lastLoggedProgressRef = useRef<number>(-1);
  const [containerReady, setContainerReady] = useState(false);

  // Callback ref to know when container is mounted
  useEffect(() => {
    if (containerRef.current) {
      setContainerReady(true);
    }
  }, [containerRef]);

  // Initialize WaveSurfer (only when visible)
  useEffect(() => {
    if (
      !audioUrl ||
      audioUrl === "uploading" ||
      !containerReady ||
      !containerRef.current ||
      !isVisible
    ) {
      return;
    }

    const container = containerRef.current;

    // Ensure container has dimensions - wait for next frame if needed
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      const timeoutId = setTimeout(() => {
        // This will cause the effect to re-run if container gets dimensions
      }, 200);
      return () => clearTimeout(timeoutId);
    }

    // Destroy existing instance if URL changed
    if (wavesurferRef.current) {
      console.log("[Waveform] Destroying existing WaveSurfer instance");
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    setIsReady(false);

    // Get colors based on theme
    const colors = getWaveformColors(theme, resolvedTheme);

    // Create WaveSurfer instance
    const wavesurfer = WaveSurfer.create({
      container: container,
      waveColor: colors.waveColor,
      progressColor: colors.progressColor,
      cursorColor: colors.cursorColor,
      barWidth: WAVEFORM_CONFIG.barWidth,
      barRadius: WAVEFORM_CONFIG.barRadius,
      height: WAVEFORM_CONFIG.height,
      normalize: WAVEFORM_CONFIG.normalize,
      interact: WAVEFORM_CONFIG.interact,
      cursorWidth: WAVEFORM_CONFIG.cursorWidth,
      barGap: WAVEFORM_CONFIG.barGap,
      sampleRate: WAVEFORM_CONFIG.sampleRate,
    });

    wavesurferRef.current = wavesurfer;

    // Override seekTo to log all calls
    const originalSeekTo = wavesurfer.seekTo.bind(wavesurfer);
    wavesurfer.seekTo = (progress: number) => {
      console.log("[Waveform Debug] seekTo called:", {
        audioId,
        progress,
        seekToTime: `${Math.floor(progress * wavesurfer.getDuration())}s`,
        currentTime: wavesurfer.getCurrentTime(),
        stackTrace: new Error().stack?.split("\n").slice(2, 6).join("\n"), // Show call stack
      });
      return originalSeekTo(progress);
    };

    // Event handlers
    wavesurfer.on("play", () => {
      console.log("[Waveform Debug] play event:", {
        audioId,
        currentTime: wavesurfer.getCurrentTime(),
        duration: wavesurfer.getDuration(),
      });
      setIsPlaying(true);
    });

    wavesurfer.on("pause", () => {
      console.log("[Waveform Debug] pause event:", {
        audioId,
        currentTime: wavesurfer.getCurrentTime(),
      });
      setIsPlaying(false);
    });

    wavesurfer.on("finish", () => {
      console.log("[Waveform Debug] finish event:", {
        audioId,
      });
      setIsPlaying(false);
    });

    // Debug ALL events that could affect seeking
    wavesurfer.on("interaction", (relativeX) => {
      console.log("[Waveform Debug] interaction event:", {
        audioId,
        relativeX,
        currentTimeBefore: wavesurfer.getCurrentTime(),
        duration: wavesurfer.getDuration(),
        isPlaying: wavesurfer.isPlaying(),
      });
    });

    wavesurfer.on("seeking", (currentTime) => {
      console.log("[Waveform Debug] seeking event:", {
        audioId,
        currentTime,
        duration: wavesurfer.getDuration(),
        isPlaying: wavesurfer.isPlaying(),
      });
    });

    wavesurfer.on("timeupdate", (currentTime) => {
      // Log only when time jumps (not continuous playback)
      const lastTime = wavesurfer.getCurrentTime();
      if (Math.abs(currentTime - lastTime) > 0.5) {
        console.log("[Waveform Debug] timeupdate (jump):", {
          audioId,
          from: lastTime,
          to: currentTime,
          duration: wavesurfer.getDuration(),
        });
      }
    });

    wavesurfer.on("error", (error) => {
      console.error("[Waveform] WaveSurfer error:", {
        error,
        audioId,
        audioUrl,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      setIsReady(false);
    });

    wavesurfer.on("loading", (progress) => {
      // Only log every 10% increments
      const progressPercent = Math.floor(progress);
      if (
        progressPercent % 10 === 0 &&
        progressPercent !== lastLoggedProgressRef.current
      ) {
        lastLoggedProgressRef.current = progressPercent;
        console.log("[Waveform] Loading progress:", {
          audioId,
          progress: `${progressPercent}%`,
        });
      }
    });

    // Extract and save peaks when audio is ready (decode event may not fire reliably)
    const extractAndSavePeaks = async () => {
      console.log("[Waveform] Attempting to extract peaks:", {
        audioId,
        hasExistingPeaks: !!waveformPeaks,
        peaksLength: waveformPeaks?.length || 0,
        hasWaveSurferRef: !!wavesurferRef.current,
        isTempId: audioId?.startsWith("temp-"),
      });

      // Only save for real audio items (not temp ones that don't exist in DB yet)
      if (
        !waveformPeaks &&
        wavesurferRef.current &&
        audioId &&
        !audioId.startsWith("temp-")
      ) {
        console.log("[Waveform] Generating and saving peaks for audio:", audioId);
        try {
          // In WaveSurfer.js v7+, use getDecodedData() to get the decoded audio buffer
          const decodedData = wavesurferRef.current.getDecodedData();
          if (!decodedData) {
            console.error("[Waveform] No decoded data available yet");
            return;
          }

          console.log("[Waveform] Got decoded data:", {
            numberOfChannels: decodedData.numberOfChannels,
            sampleRate: decodedData.sampleRate,
            duration: decodedData.duration,
            length: decodedData.length,
          });

          // Extract peaks from the decoded audio data
          // Get the first channel's data
          const channelData = decodedData.getChannelData(0);
          const sampleRate = decodedData.sampleRate;
          const duration = decodedData.duration;

          // Calculate number of peaks we want (1024 peaks)
          const peaksLength = WAVEFORM_CONFIG.peaksLength;
          const samplesPerPeak = Math.floor(channelData.length / peaksLength);

          console.log("[Waveform] Extracting peaks:", {
            channelDataLength: channelData.length,
            peaksLength,
            samplesPerPeak,
          });

          // Extract peaks by taking max absolute value in each sample range
          const peaks: number[] = [];
          for (let i = 0; i < peaksLength; i++) {
            let max = 0;
            const start = i * samplesPerPeak;
            const end = Math.min(start + samplesPerPeak, channelData.length);

            for (let j = start; j < end; j++) {
              const abs = Math.abs(channelData[j]);
              if (abs > max) max = abs;
            }

            peaks.push(max);
          }

          console.log("[Waveform] Generated peaks:", {
            peaksLength: peaks.length,
            peaksPreview: peaks.slice(0, 10),
            peaksMax: Math.max(...peaks),
            peaksMin: Math.min(...peaks),
            audioId,
            originalLength: channelData.length,
            sampleRate,
            duration,
          });

          // Get auth token for API call
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData?.session?.access_token;
          console.log("[Waveform] Auth token available:", !!accessToken);

          // Save peaks to database
          console.log(
            "[Waveform] Sending peaks to API:",
            `/api/admin/albums/audios/${audioId}/peaks`
          );
          console.log("[Waveform] Peaks data being sent:", {
            peaksArrayLength: peaks.length,
            firstFewPeaks: peaks.slice(0, 5),
            isArray: Array.isArray(peaks),
            allNumbers: peaks.every((p) => typeof p === "number"),
          });

          const response = await fetch(
            `/api/admin/albums/audios/${audioId}/peaks`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
              },
              body: JSON.stringify({ peaks }),
            }
          );

          console.log("[Waveform] API response:", {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            audioId,
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({
              error: "Unknown error",
            }));
            console.error("[Waveform] Failed to save waveform peaks:", {
              error,
              audioId,
              status: response.status,
              statusText: response.statusText,
            });
            // Don't show toast for this - it's a background operation
          } else {
            const result = await response.json().catch(() => ({}));
            console.log("[Waveform] Peaks saved successfully:", {
              audioId,
              result,
            });
          }
        } catch (error) {
          console.error("[Waveform] Error saving waveform peaks:", {
            error,
            audioId,
            errorMessage:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
          });
        }
      } else {
        console.log("[Waveform] Skipping peak generation:", {
          hasPeaks: !!waveformPeaks,
          hasWaveSurferRef: !!wavesurferRef.current,
          hasAudioId: !!audioId,
          isTempId: audioId?.startsWith("temp-"),
        });
      }
    };

    // Try to extract peaks when ready (more reliable than decode event)
    wavesurfer.on("ready", () => {
      console.log("[Waveform] WaveSurfer ready event fired:", {
        audioId,
        duration: wavesurferRef.current?.getDuration(),
      });
      setIsReady(true);
      const currentDuration = wavesurfer.getDuration();
      if (currentDuration) {
        setDuration(currentDuration);
      }

      // Try to extract peaks after a short delay to ensure decoded data is available
      setTimeout(() => {
        extractAndSavePeaks();
      }, 100);
    });

    // Also listen to decode event as backup
    wavesurfer.on("decode", async () => {
      console.log("[Waveform] Decode event fired for audio:", {
        audioId,
      });
      extractAndSavePeaks();
    });

    // Use proxy URL to bypass CORS
    const proxyUrl = `/api/proxy/audio?url=${encodeURIComponent(audioUrl)}`;

    // Load audio with pre-computed peaks if available (much faster!)
    try {
      const peaks = waveformPeaks;
      if (peaks && Array.isArray(peaks) && peaks.length > 0) {
        // WaveSurfer expects peaks as a 2D array [channel1, channel2, ...]
        // Convert our 1D array to 2D format (mono = 1 channel)
        const peaksData = [Array.from(peaks)] as
          | [Float32Array]
          | [number[]];

        console.log("[Waveform] Loading with pre-computed peaks:", {
          audioId,
          peaksLength: peaks.length,
          proxyUrl,
        });

        wavesurfer.load(proxyUrl, peaksData);
      } else {
        console.log("[Waveform] Loading without peaks (will decode):", {
          audioId,
          hasPeaks: !!peaks,
          peaksLength: Array.isArray(peaks) ? peaks.length : 0,
          proxyUrl,
        });
        wavesurfer.load(proxyUrl);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("[Waveform] Error loading audio:", {
        error: errorMessage,
        audioId,
        proxyUrl,
        audioUrl,
      });
      setIsReady(false);
    }

    // Cleanup
    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
      setIsReady(false);
      setIsPlaying(false);
    };
  }, [
    audioUrl,
    containerReady,
    isVisible,
    theme,
    resolvedTheme,
    audioId,
    waveformPeaks,
    containerRef,
  ]);

  return {
    wavesurfer: wavesurferRef.current,
    isReady,
    isPlaying,
    duration,
  };
}
