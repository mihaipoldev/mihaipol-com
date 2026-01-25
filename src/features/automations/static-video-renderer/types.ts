import type { ImageMetadata } from "../types";

/**
 * Input data structure matching the form schema
 */
export type StaticVideoRendererInput = {
  videos: VideoEntry[];
  quality: "720p" | "1080p" | "4k";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  background_color: "black" | "white" | "blur";
  format?: "mp4" | "mov" | "webm";
  output_format?: string; // Currently not used (images only)
  send_completion_notification?: boolean; // Currently not used
};

export type VideoEntry = {
  image_id: string;
  track_ids?: string[]; // Currently not used
  video_type?: "short" | "long"; // Currently not used
  video_title?: string; // Currently not used
  video_description?: string; // Currently not used
};

/**
 * Output structure for processed video/image
 */
export type ProcessedVideoOutput = {
  index: number;
  image_id: string;
  processed_image_url: string;
  metadata: ImageMetadata;
};

/**
 * Processing options
 */
export type ProcessingOptions = {
  quality: "720p" | "1080p" | "4k";
  aspectRatio: "16:9" | "9:16" | "1:1";
  backgroundColor: "black" | "white" | "blur";
};
