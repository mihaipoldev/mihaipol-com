import sharp from "sharp";
import type { ImageMetadata, CircleInfo, ArtworkShape, CropRecommendation } from "../types";
import {
  getOptimalCropCoordinates,
  applyCrop,
} from "./ai-cropping";

const YOUTUBE_CANVAS_WIDTH = 1920;
const YOUTUBE_CANVAS_HEIGHT = 1080;
const YOUTUBE_TARGET_HEIGHT = 1000;
const JPEG_QUALITY = 95;
const CIRCLE_DETECTION_THRESHOLD = 0.7; // Minimum confidence to consider it circular
const ASPECT_RATIO_TOLERANCE = 0.05; // 5% tolerance for 1:1 ratio
const CIRCLE_EDGE_INSET = 3; // Pixels to inset circle mask to avoid white edge artifacts

/**
 * Detects if an image is circular by analyzing aspect ratio and edge patterns
 */
export async function detectCircle(imageBuffer: Buffer): Promise<CircleInfo> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width === 0 || height === 0) {
    return {
      isCircular: false,
      radius: 0,
      center: { x: 0, y: 0 },
      confidence: 0,
    };
  }

  // Check 1: Aspect ratio (circle should be roughly square)
  const aspectRatio = width / height;
  const aspectRatioScore =
    aspectRatio >= 1 - ASPECT_RATIO_TOLERANCE && aspectRatio <= 1 + ASPECT_RATIO_TOLERANCE
      ? 1.0
      : Math.max(0, 1 - Math.abs(aspectRatio - 1) / ASPECT_RATIO_TOLERANCE);

  // Check 2: Sample corner pixels (for circular images, corners should be transparent/dark)
  // Get raw image data once for efficiency
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2;

  let edgeScore = 0;
  try {
    const rawBuffer = await sharp(imageBuffer).ensureAlpha().raw().toBuffer();
    const metadata = await sharp(imageBuffer).metadata();
    const channels = metadata.channels || 4;
    const stride = channels;

    // Sample corner pixels (at corners of the bounding box)
    const cornerSamples = [
      { x: 0, y: 0 }, // Top-left
      { x: width - 1, y: 0 }, // Top-right
      { x: 0, y: height - 1 }, // Bottom-left
      { x: width - 1, y: height - 1 }, // Bottom-right
    ];

    let darkCornerCount = 0;
    for (const corner of cornerSamples) {
      const idx = (corner.y * width + corner.x) * stride;
      if (idx >= 0 && idx < rawBuffer.length) {
        if (channels === 4) {
          const alpha = rawBuffer[idx + 3];
          const r = rawBuffer[idx];
          const g = rawBuffer[idx + 1];
          const b = rawBuffer[idx + 2];
          // Consider dark if alpha is low or RGB values are very low
          if (alpha < 128 || (r < 50 && g < 50 && b < 50)) {
            darkCornerCount++;
          }
        } else {
          const r = rawBuffer[idx];
          const g = rawBuffer[idx + 1];
          const b = rawBuffer[idx + 2];
          if (r < 50 && g < 50 && b < 50) {
            darkCornerCount++;
          }
        }
      }
    }
    edgeScore = darkCornerCount / cornerSamples.length;
  } catch (error) {
    // If pixel sampling fails, rely only on aspect ratio
    console.warn("Failed to sample pixels for circle detection, using aspect ratio only:", error);
    edgeScore = 0.5; // Neutral score
  }

  // Calculate confidence based on aspect ratio and edge sampling
  const confidence = aspectRatioScore * 0.7 + edgeScore * 0.3;

  const isCircular = confidence >= CIRCLE_DETECTION_THRESHOLD;

  return {
    isCircular,
    radius,
    center: { x: centerX, y: centerY },
    confidence,
  };
}

/**
 * Extracts an existing circle from already-circular artwork
 */
async function extractExistingCircle(imageBuffer: Buffer, circleInfo: CircleInfo): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Create circular SVG mask with inset to avoid white edge artifacts
  const adjustedRadius = Math.max(1, circleInfo.radius - CIRCLE_EDGE_INSET);
  const centerX = circleInfo.center.x;
  const centerY = circleInfo.center.y;

  const circleMaskSvg = Buffer.from(
    `<svg width="${width}" height="${height}">
      <circle cx="${centerX}" cy="${centerY}" r="${adjustedRadius}" fill="white" />
    </svg>`
  );

  // Apply mask using dest-in blend mode to keep only circular area
  const circularImage = await sharp(imageBuffer)
    .composite([
      {
        input: circleMaskSvg,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return circularImage;
}

/**
 * Creates a circular mask for square artwork
 */
async function createCircularMask(imageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  // Create circular SVG mask - diameter is min of width/height
  // Inset radius to avoid white edge artifacts
  const diameter = Math.min(width, height);
  const radius = Math.max(1, diameter / 2 - CIRCLE_EDGE_INSET);
  const centerX = width / 2;
  const centerY = height / 2;

  const circleMaskSvg = Buffer.from(
    `<svg width="${width}" height="${height}">
      <circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="white" />
    </svg>`
  );

  // Apply mask using dest-in blend mode
  const circularImage = await sharp(imageBuffer)
    .composite([
      {
        input: circleMaskSvg,
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  return circularImage;
}

/**
 * Removes dark background while preserving square shape
 */
async function removeDarkBackground(imageBuffer: Buffer): Promise<Buffer> {
  // Enhanced trim to remove dark/transparent edges
  // Use a more aggressive threshold for square mode
  const cleaned = await sharp(imageBuffer)
    .trim({
      threshold: 15, // Slightly more aggressive than default
    })
    .toBuffer();

  return cleaned;
}

export async function processArtworkForYouTube(
  imageBuffer: Buffer,
  shape: ArtworkShape = "circle"
): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
  const startTime = Date.now();

  // Get original image metadata
  const originalMetadata = await sharp(imageBuffer).metadata();
  const originalWidth = originalMetadata.width || 0;
  const originalHeight = originalMetadata.height || 0;

  console.log("[Process Artwork] Starting processing");
  console.log("[Process Artwork] Original image:", {
    width: originalWidth,
    height: originalHeight,
    format: originalMetadata.format,
  });
  console.log("[Process Artwork] Shape:", shape);

  // Step 1: Use original image directly (no initial trim - matches n8n workflow)
  // The AI will determine the optimal crop boundaries
  let processedArtwork = imageBuffer;
  let trimmedWidth = originalWidth;
  let trimmedHeight = originalHeight;
  let detectedAsCircular = false;
  let processingMethod: "extracted" | "masked" | "preserved" = "preserved";
  let aiCropUsed = false;
  let aiReasoning: string | undefined;
  let aiFallbackReason: string | undefined;

  // Step 2: Shape processing (based on user selection)
  // Try AI-powered content-aware cropping first
  let cropInfo: CropRecommendation | null = null;
  try {
    console.log(`[Artwork Processing] Attempting AI-powered ${shape} cropping...`);
    cropInfo = await getOptimalCropCoordinates(processedArtwork, shape);

    // Check if AI was actually used (not fallback)
    if (cropInfo.reasoning && !cropInfo.reasoning.includes("Fallback used")) {
      console.log(
        `[Artwork Processing] AI ${shape} crop coordinates: top=${cropInfo.top.toFixed(2)}, bottom=${cropInfo.bottom.toFixed(2)}, left=${cropInfo.left.toFixed(2)}, right=${cropInfo.right.toFixed(2)}`
      );
      console.log(`[Artwork Processing] AI Reasoning: ${cropInfo.reasoning}`);
      if ((cropInfo as any).rawResponse) {
        console.log(`[Artwork Processing] AI Raw Response: ${(cropInfo as any).rawResponse}`);
      }
      
      processedArtwork = await applyCrop(processedArtwork, cropInfo, shape);
      aiCropUsed = true;
      aiReasoning = cropInfo.reasoning;
      processingMethod = shape === "circle" ? "masked" : "preserved";
    } else {
      // AI returned fallback, use geometric method
      throw new Error("AI unavailable, using geometric fallback");
    }
  } catch (error: any) {
    // Fallback to geometric methods
    console.log(
      `[Artwork Processing] AI cropping failed, using geometric method: ${error.message}`
    );
    aiFallbackReason = error.message;

    if (shape === "circle") {
      const circleInfo = await detectCircle(processedArtwork);

      if (circleInfo.isCircular && circleInfo.confidence >= CIRCLE_DETECTION_THRESHOLD) {
        // Extract existing circle perfectly
        console.log(
          `[Artwork Processing] Detected circular artwork (confidence: ${circleInfo.confidence.toFixed(2)})`
        );
        processedArtwork = await extractExistingCircle(processedArtwork, circleInfo);
        detectedAsCircular = true;
        processingMethod = "extracted";
      } else {
        // Apply circular mask centered
        console.log(
          `[Artwork Processing] Applying circular mask (detection confidence: ${circleInfo.confidence.toFixed(2)})`
        );
        processedArtwork = await createCircularMask(processedArtwork);
        detectedAsCircular = false;
        processingMethod = "masked";
      }
    } else {
      // Square mode: no additional processing needed, AI crop already handled it
      // Just use the cropped result as-is
      processingMethod = "preserved";
    }
  }

  // Update dimensions after shape processing
  const processedMetadata = await sharp(processedArtwork).metadata();
  trimmedWidth = processedMetadata.width || 0;
  trimmedHeight = processedMetadata.height || 0;

  // Step 3: Resize to target height
  // For circles: resize to square (targetHeight x targetHeight) to ensure consistent size
  // For squares: resize maintaining aspect ratio
  const hasTransparency = shape === "circle";
  let resized = processedArtwork;
  let resizedWidth = trimmedWidth;
  let resizedHeight = trimmedHeight;

  if (shape === "circle") {
    // For circles, always resize to square (targetHeight x targetHeight)
    // This ensures consistent circle size regardless of original crop dimensions
    console.log(
      `[Resize] Resizing circle to ${YOUTUBE_TARGET_HEIGHT}x${YOUTUBE_TARGET_HEIGHT}`
    );
    resized = await sharp(processedArtwork)
      .ensureAlpha()
      .resize({
        width: YOUTUBE_TARGET_HEIGHT,
        height: YOUTUBE_TARGET_HEIGHT,
        fit: "contain", // Ensure entire circle fits
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent background
      })
      .png() // Keep PNG for transparency
      .toBuffer();

    const resizedMetadata = await sharp(resized).metadata();
    resizedWidth = resizedMetadata.width || 0;
    resizedHeight = resizedMetadata.height || 0;
    console.log("After resize size:", resizedWidth, "x", resizedHeight);
  } else {
    // For squares, resize maintaining aspect ratio
    if (trimmedHeight > YOUTUBE_TARGET_HEIGHT) {
      resized = await sharp(processedArtwork)
        .resize({
          height: YOUTUBE_TARGET_HEIGHT,
          withoutEnlargement: true,
          fit: "inside",
        })
        .toBuffer();

      const resizedMetadata = await sharp(resized).metadata();
      resizedWidth = resizedMetadata.width || 0;
      resizedHeight = resizedMetadata.height || 0;
      console.log("After resize size:", resizedWidth, "x", resizedHeight);
    }
  }

  // Step 4: Create 1920x1080 black canvas and composite resized image in center
  const leftOffset = Math.floor((YOUTUBE_CANVAS_WIDTH - resizedWidth) / 2);
  const topOffset = Math.floor((YOUTUBE_CANVAS_HEIGHT - resizedHeight) / 2);

  console.log("Final canvas:", YOUTUBE_CANVAS_WIDTH, "x", YOUTUBE_CANVAS_HEIGHT);
  console.log("Composite position: left=", leftOffset, ", top=", topOffset);

  // Use RGBA canvas if we have transparency, RGB otherwise
  const canvasChannels = hasTransparency ? 4 : 3;
  const canvasBackground = hasTransparency
    ? { r: 0, g: 0, b: 0, alpha: 1 }
    : { r: 0, g: 0, b: 0 };

  const finalBuffer = await sharp({
    create: {
      width: YOUTUBE_CANVAS_WIDTH,
      height: YOUTUBE_CANVAS_HEIGHT,
      channels: canvasChannels,
      background: canvasBackground,
    },
  })
    .composite([
      {
        input: resized,
        left: leftOffset,
        top: topOffset,
      },
    ])
    .jpeg({ quality: JPEG_QUALITY }) // Convert to JPEG only at the very end
    .toBuffer();

  const processingTime = Date.now() - startTime;

  const metadata: ImageMetadata = {
    originalSize: {
      width: originalWidth,
      height: originalHeight,
    },
    trimmedSize: {
      width: trimmedWidth,
      height: trimmedHeight,
    },
    finalSize: {
      width: YOUTUBE_CANVAS_WIDTH,
      height: YOUTUBE_CANVAS_HEIGHT,
    },
    processingTime,
    shapeProcessing: {
      shape,
      detectedAsCircular,
      method: processingMethod,
    },
    aiCropInfo: aiCropUsed && cropInfo
      ? {
          used: true,
          reasoning: aiReasoning,
          fallbackReason: aiFallbackReason,
          rawResponse: (cropInfo as any).rawResponse,
          cropCoordinates: {
            top: cropInfo.top,
            bottom: cropInfo.bottom,
            left: cropInfo.left,
            right: cropInfo.right,
          },
        }
      : {
          used: false,
          fallbackReason: aiFallbackReason,
        },
  };

  return {
    buffer: finalBuffer,
    metadata,
  };
}
