import type { ImageMetadata } from "../types";
import type {
  VideoQuality,
  AspectRatio,
  BackgroundColor,
} from "../static-video-renderer/utils";

/**
 * Input data structure for image processor automation
 */
export interface ImageProcessorInput {
  image_id: string;
  quality: VideoQuality;
  aspect_ratio: AspectRatio;
  background_color: BackgroundColor;
}

/**
 * Output data structure for image processor automation
 */
export interface ImageProcessorOutput {
  processed_image_url: string;
  metadata: ImageMetadata;
}

// Re-export types for convenience
export type { VideoQuality, AspectRatio, BackgroundColor } from "../static-video-renderer/utils";
export type { ImageMetadata } from "../types";
