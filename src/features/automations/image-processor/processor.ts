import sharp from "sharp";
import type { ImageMetadata } from "../types";
import {
  calculateCanvasDimensions,
  calculateImageSize,
  backgroundColorToRgb,
  type VideoQuality,
  type AspectRatio,
  type BackgroundColor,
} from "../static-video-renderer/utils";

const JPEG_QUALITY = 98; // Increased quality to reduce compression artifacts
const BLUR_SIGMA = 25; // Blur intensity for blur effect

/**
 * Process an image for video creation with dynamic canvas and background options
 */
export async function processImageForVideo(
  imageBuffer: Buffer,
  options: {
    quality: VideoQuality;
    aspectRatio: AspectRatio;
    backgroundColor: BackgroundColor;
  }
): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
  const startTime = Date.now();

  // Get original image metadata
  const originalMetadata = await sharp(imageBuffer).metadata();
  const originalWidth = originalMetadata.width || 0;
  const originalHeight = originalMetadata.height || 0;

  console.log("[Process Image] Starting processing", {
    quality: options.quality,
    aspectRatio: options.aspectRatio,
    backgroundColor: options.backgroundColor,
    originalSize: `${originalWidth}x${originalHeight}`,
  });

  // Calculate canvas dimensions
  const canvasDimensions = calculateCanvasDimensions(options.quality, options.aspectRatio);
  const canvasWidth = canvasDimensions.width;
  const canvasHeight = canvasDimensions.height;

  // Calculate target image size (95% of smallest canvas dimension)
  const targetImageSize = calculateImageSize(canvasWidth, canvasHeight);

  console.log("[Process Image] Canvas:", `${canvasWidth}x${canvasHeight}`, "Target image size:", targetImageSize);

  // Resize image to target size maintaining aspect ratio
  let resized = imageBuffer;
  let resizedWidth = originalWidth;
  let resizedHeight = originalHeight;

  // Only resize if image is larger than target
  const imageMaxDimension = Math.max(originalWidth, originalHeight);
  if (imageMaxDimension > targetImageSize) {
    resized = await sharp(imageBuffer)
      .resize({
        width: targetImageSize,
        height: targetImageSize,
        withoutEnlargement: true,
        fit: "inside", // Maintain aspect ratio, fit within bounds
        kernel: "lanczos3", // High-quality resampling for better edge preservation
      })
      .toBuffer();

    const resizedMetadata = await sharp(resized).metadata();
    resizedWidth = resizedMetadata.width || 0;
    resizedHeight = resizedMetadata.height || 0;
    console.log("[Process Image] Resized to:", `${resizedWidth}x${resizedHeight}`);
  }

  // Calculate center position
  const leftOffset = Math.floor((canvasWidth - resizedWidth) / 2);
  const topOffset = Math.floor((canvasHeight - resizedHeight) / 2);

  console.log("[Process Image] Composite position:", `left=${leftOffset}, top=${topOffset}`);

  let finalBuffer: Buffer;

  if (options.backgroundColor === "blur") {
    // Blur effect: create blurred background + sharp foreground
    // 1. Create blurred background (resize original to canvas size and blur)
    const blurredBackground = await sharp(imageBuffer)
      .resize(canvasWidth, canvasHeight, {
        fit: "cover", // Fill entire canvas
        kernel: "lanczos3", // High-quality resampling
      })
      .blur(BLUR_SIGMA)
      .toBuffer();

    // 2. Create sharp foreground (resized image)
    const sharpForeground = resized;

    // 3. Composite: blurred background + sharp foreground centered
    finalBuffer = await sharp(blurredBackground)
      .composite([
        {
          input: sharpForeground,
          left: leftOffset,
          top: topOffset,
          blend: "over", // Ensure proper blending
        },
      ])
      .jpeg({ 
        quality: JPEG_QUALITY,
        mozjpeg: true, // Use mozjpeg for better quality/compression
      })
      .toBuffer();
  } else {
    // Solid color background (black or white)
    const bgColor = backgroundColorToRgb(options.backgroundColor);
    
    console.log("[Process Image] Background color:", options.backgroundColor, "RGB:", bgColor);

    // Ensure resized image is properly formatted (JPEG) before compositing
    // This prevents format issues and ensures compatibility
    const resizedMetadata = await sharp(resized).metadata();
    const hasAlpha = resizedMetadata.hasAlpha || false;
    
    // Convert resized image to JPEG to ensure it's a valid format for compositing
    // If it has alpha, flatten it on the background color first
    let imageToComposite: Buffer;
    
    if (hasAlpha) {
      // Flatten alpha channel onto background color using Sharp's flatten
      // This properly handles alpha without edge artifacts
      imageToComposite = await sharp(resized)
        .flatten({ background: bgColor }) // Flatten alpha onto background color
        .jpeg({ 
          quality: JPEG_QUALITY,
          mozjpeg: true,
        })
        .toBuffer();
    } else {
      // No alpha channel, just ensure it's JPEG format
      imageToComposite = await sharp(resized)
        .jpeg({ 
          quality: JPEG_QUALITY,
          mozjpeg: true,
        })
        .toBuffer();
    }

    // Create final canvas with background color
    finalBuffer = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: bgColor, // Use RGB object directly - Sharp handles this well
      },
    })
      .composite([
        {
          input: imageToComposite,
          left: leftOffset,
          top: topOffset,
        },
      ])
      .jpeg({ 
        quality: JPEG_QUALITY,
        mozjpeg: true, // Use mozjpeg for better quality/compression
      })
      .toBuffer();
  }

  const processingTime = Date.now() - startTime;

  const metadata: ImageMetadata = {
    originalSize: {
      width: originalWidth,
      height: originalHeight,
    },
    finalSize: {
      width: canvasWidth,
      height: canvasHeight,
    },
    processingTime,
  };

  console.log("[Process Image] Processing completed in", processingTime, "ms");

  return {
    buffer: finalBuffer,
    metadata,
  };
}
