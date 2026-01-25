/**
 * Utility functions for static video renderer
 */

export type VideoQuality = "720p" | "1080p" | "4k";
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type BackgroundColor = "black" | "white" | "blur";

/**
 * Quality dimensions (16:9 base)
 */
const QUALITY_DIMENSIONS: Record<VideoQuality, { width: number; height: number }> = {
  "720p": { width: 1280, height: 720 },
  "1080p": { width: 1920, height: 1080 },
  "4k": { width: 3840, height: 2160 },
};

/**
 * Get CRF (Constant Rate Factor) for video encoding based on quality
 * Lower CRF = higher quality (but larger file size)
 * Recommended: 18 (high), 23 (good), 28 (compressed)
 */
export function getVideoCRF(quality: VideoQuality): number {
  switch (quality) {
    case "4k":
      return 18; // High quality for 4K
    case "1080p":
      return 23; // Good quality for 1080p
    case "720p":
      return 25; // Slightly compressed for 720p
    default:
      return 23;
  }
}

/**
 * Calculate canvas dimensions based on quality and aspect ratio
 */
export function calculateCanvasDimensions(
  quality: VideoQuality,
  aspectRatio: AspectRatio
): { width: number; height: number } {
  const baseDimensions = QUALITY_DIMENSIONS[quality];

  switch (aspectRatio) {
    case "16:9":
      // Landscape: use quality dimensions as-is
      return { width: baseDimensions.width, height: baseDimensions.height };
    case "9:16":
      // Portrait: swap width and height
      return { width: baseDimensions.height, height: baseDimensions.width };
    case "1:1":
      // Square: use smallest dimension for both
      const smallest = Math.min(baseDimensions.width, baseDimensions.height);
      return { width: smallest, height: smallest };
    default:
      return baseDimensions;
  }
}

/**
 * Calculate target image size (95% of smallest canvas dimension)
 */
export function calculateImageSize(canvasWidth: number, canvasHeight: number): number {
  const smallestDimension = Math.min(canvasWidth, canvasHeight);
  return Math.floor(smallestDimension * 0.95);
}

/**
 * Convert background color string to RGB object
 */
export function backgroundColorToRgb(color: BackgroundColor): { r: number; g: number; b: number } {
  switch (color) {
    case "black":
      return { r: 0, g: 0, b: 0 };
    case "white":
      return { r: 255, g: 255, b: 255 };
    case "blur":
      // For blur, we'll use black as fallback (actual blur is handled in processor)
      return { r: 0, g: 0, b: 0 };
    default:
      return { r: 0, g: 0, b: 0 };
  }
}
