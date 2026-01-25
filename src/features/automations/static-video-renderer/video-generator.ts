import { ffmpegClient } from "../shared/ffmpeg-client";
import type { VideoQuality } from "./utils";

interface VideoGenerationOptions {
  imageUrl: string;
  audioUrl: string;
  videoType: "short" | "long";
  duration: number;
  highlightStart?: number;
  highlightEnd?: number;
  format: "mp4" | "mov" | "webm";
  quality: VideoQuality;
  runId: string; // Need this to track tasks
}

export async function generateVideo(
  options: VideoGenerationOptions
): Promise<string> {
  const {
    imageUrl,
    audioUrl,
    videoType,
    duration,
    highlightStart,
    highlightEnd,
    format,
    quality,
    runId,
  } = options;

  let videoDuration: number;
  let audioStart: number = 0;

  if (videoType === "short" && highlightStart !== undefined) {
    if (highlightEnd !== undefined && highlightEnd > highlightStart) {
      // Use provided highlight end time
      videoDuration = highlightEnd - highlightStart;
      audioStart = highlightStart;
    } else {
      // Fallback: use 60 seconds or remaining track duration
      videoDuration = Math.min(60, duration - highlightStart);
      audioStart = highlightStart;
    }
  } else {
    // Long video: use full track
    videoDuration = duration;
    audioStart = 0;
  }

  console.log("[Video Generator] Creating FFmpeg task:", {
    videoType,
    videoDuration,
    audioStart,
    quality,
  });

  // Use smart generateVideo method that handles dev/prod automatically
  // In dev: returns video URL directly (after polling)
  // In prod: returns task_id (webhook updates later)
  const result = await ffmpegClient.generateVideo({
    imageUrl,
    audioUrl,
    duration: videoDuration,
    audioStart,
    outputFormat: format,
    quality,
  });

  // Result is either video URL (dev) or task_id (prod)
  return result;
}
