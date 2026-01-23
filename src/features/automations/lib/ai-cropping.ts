import { GoogleGenerativeAI } from "@google/generative-ai";
import sharp from "sharp";
import type { CropRecommendation, ArtworkShape } from "../types";

const GEMINI_MODEL = "gemini-2.5-pro"; // Using Pro for better accuracy
const AI_CROP_TIMEOUT = 30000; // 30 seconds (Pro is slower than Flash)
const CIRCLE_EDGE_INSET = 3; // Pixels to inset circle mask to avoid white edge artifacts

const FALLBACK_CROP: CropRecommendation = {
  top: 0.02,
  bottom: 0.98,
  left: 0.02,
  right: 0.98,
  reasoning: "Using safe center crop (AI unavailable)",
};

/**
 * Gets optimal crop coordinates from Google Gemini AI based on user-selected shape
 */
export async function getOptimalCropCoordinates(
  imageBuffer: Buffer,
  shape: ArtworkShape
): Promise<CropRecommendation> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  // If API key is missing, return fallback immediately
  if (!apiKey) {
    console.log("[AI Cropping] GOOGLE_AI_API_KEY not set, using fallback");
    return FALLBACK_CROP;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString("base64");

    const prompt = `Analyze this music album artwork. The user wants to format it as a ${shape.toUpperCase()}.

Find the OPTIMAL CROP BOUNDARIES to make this look best. The idea is to look good on a ${shape.toUpperCase()} format, very important.

CRITICAL RULES:
1. Be CONSERVATIVE with cropping - it's better to include slightly more than to cut into the artwork
2. For small centered icons/logos: DO NOT try to fit just the icon - keep the composition centered and let the icon sit naturally in the frame
3. Only trim obvious excess margins/backgrounds
4. Most artwork is already well-composed - minimal trimming is usually best

Your task:
- Identify any dark/light margins or excess background that should be removed
- Do NOT crop into the actual artwork content
- For centered designs with small elements, keep them centered (use 0.01-0.99 range)

- When in doubt, crop LESS rather than MORE
- if text can;t enter in the full shape, better do somerhing so we cut it and we show the important elements rather then half phrases

Provide crop boundaries (0-1 scale):
- top: where to crop from top (0 = top edge)
- bottom: where to crop from bottom (1 = bottom edge)
- left: where to crop from left (0 = left edge)
- right: where to crop from right (1 = right edge)

Return ONLY JSON:
{
  "top": 0.03,
  "bottom": 0.97,
  "left": 0.03,
  "right": 0.97,
  "reasoning": "Brief explanation - what did you trim and why?"
}`;

    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("AI crop request timeout")), AI_CROP_TIMEOUT);
    });

    // Call Gemini API with timeout
    const result = await Promise.race([
      model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ]),
      timeoutPromise,
    ]);

    const response = result.response;
    const text = response.text();

    // Parse JSON from response (Gemini may include markdown formatting)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response - no JSON found");
    }

    const cropData = JSON.parse(jsonMatch[0]) as CropRecommendation;

    // Validate values are in range
    if (
      cropData.top < 0 ||
      cropData.top > 1 ||
      cropData.bottom < 0 ||
      cropData.bottom > 1 ||
      cropData.left < 0 ||
      cropData.left > 1 ||
      cropData.right < 0 ||
      cropData.right > 1 ||
      cropData.top >= cropData.bottom ||
      cropData.left >= cropData.right
    ) {
      throw new Error(
        `Invalid crop coordinates from AI: top=${cropData.top}, bottom=${cropData.bottom}, left=${cropData.left}, right=${cropData.right}`
      );
    }

    console.log(
      `[AI Cropping] Success: top=${cropData.top.toFixed(2)}, bottom=${cropData.bottom.toFixed(2)}, left=${cropData.left.toFixed(2)}, right=${cropData.right.toFixed(2)}`
    );
    console.log(`[AI Cropping] Reasoning: ${cropData.reasoning}`);

    return cropData;
  } catch (error: any) {
    console.warn("[AI Cropping] Failed, using fallback:", error.message);
    return {
      ...FALLBACK_CROP,
      reasoning: `Fallback used: ${error.message}`,
    };
  }
}

/**
 * Applies crop based on AI recommendation (bounding box) and shape
 */
export async function applyCrop(
  imageBuffer: Buffer,
  cropInfo: CropRecommendation,
  shape: ArtworkShape
): Promise<Buffer> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 0;
  const height = metadata.height || 0;

  if (width === 0 || height === 0) {
    throw new Error("Invalid image dimensions");
  }

  console.log("=== CROP DEBUG ===");
  console.log("Original size:", width, "x", height);
  console.log("Crop info:", cropInfo);
  console.log("Shape:", shape);

  // Convert 0-1 coordinates to pixels
  const topPx = Math.round(cropInfo.top * height);
  const bottomPx = Math.round(cropInfo.bottom * height);
  const leftPx = Math.round(cropInfo.left * width);
  const rightPx = Math.round(cropInfo.right * width);

  const cropWidth = rightPx - leftPx;
  const cropHeight = bottomPx - topPx;

  console.log("Crop box:", {
    left: leftPx,
    top: topPx,
    width: cropWidth,
    height: cropHeight,
  });

  // First, crop to bounding box
  const cropped = await sharp(imageBuffer)
    .extract({
      left: leftPx,
      top: topPx,
      width: cropWidth,
      height: cropHeight,
    })
    .toBuffer();

  const croppedMeta = await sharp(cropped).metadata();
  console.log("After crop size:", croppedMeta.width, "x", croppedMeta.height);

  // If circle, apply circular mask
  if (shape === "circle") {
    console.log("[Apply Crop] Applying circular mask...");
    const { width: cWidth, height: cHeight } = croppedMeta;

    // Make the cropped area square by extending with transparency
    // This ensures no content is cut off for landscape/portrait images
    const maxDim = Math.max(cWidth, cHeight);

    // Calculate how much to extend on each side
    const extendLeft = Math.floor((maxDim - cWidth) / 2);
    const extendRight = Math.ceil((maxDim - cWidth) / 2);
    const extendTop = Math.floor((maxDim - cHeight) / 2);
    const extendBottom = Math.ceil((maxDim - cHeight) / 2);

    console.log("After crop size:", cWidth, "x", cHeight);
    console.log("Extending to square:", maxDim, "x", maxDim);
    console.log("Extensions:", {
      top: extendTop,
      bottom: extendBottom,
      left: extendLeft,
      right: extendRight,
    });

    // Extend to square with transparent background
    const squared = await sharp(cropped)
      .ensureAlpha()
      .extend({
        top: extendTop,
        bottom: extendBottom,
        left: extendLeft,
        right: extendRight,
        background: { r: 0, g: 0, b: 0, alpha: 0 }, // Transparent
      })
      .png()
      .toBuffer();

    // Now apply circular mask to the square
    const squaredMeta = await sharp(squared).metadata();
    const diameter = squaredMeta.width; // Now it's square, so width = height
    const radius = Math.max(1, diameter / 2 - CIRCLE_EDGE_INSET);

    console.log(
      `[Apply Crop] Circular mask: diameter=${diameter}, radius=${radius}, center=(${diameter / 2}, ${diameter / 2})`
    );

    const circleMask = Buffer.from(
      `<svg width="${diameter}" height="${diameter}">
        <circle 
          cx="${diameter / 2}" 
          cy="${diameter / 2}" 
          r="${radius}" 
          fill="white"
        />
      </svg>`
    );

    // Apply circular mask - CRITICAL: ensure alpha channel and use PNG
    const circular = await sharp(squared)
      .ensureAlpha() // CRITICAL: Ensure alpha channel exists
      .composite([
        {
          input: circleMask,
          blend: "dest-in", // Keep only pixels inside circle
        },
      ])
      .png() // CRITICAL: Use PNG to preserve transparency
      .toBuffer();

    // Trim transparent edges
    const trimmed = await sharp(circular).trim().toBuffer();
    const trimmedMeta = await sharp(trimmed).metadata();
    console.log("After circle mask size:", trimmedMeta.width, "x", trimmedMeta.height);

    // DEBUG: Add green border around the circle (visible on final output)
    const trimmedWithBorder = await sharp(trimmed)
      .extend({
        top: 5,
        bottom: 5,
        left: 5,
        right: 5,
        background: { r: 0, g: 255, b: 0, alpha: 1 }, // GREEN border
      })
      .png()
      .toBuffer();

    console.log("==================");
    return trimmedWithBorder;
  }

  // If square, return the cropped box with border
  const croppedWithBorder = await sharp(cropped)
    .extend({
      top: 5,
      bottom: 5,
      left: 5,
      right: 5,
      background: { r: 0, g: 255, b: 0, alpha: 1 }, // GREEN border
    })
    .toBuffer();

  console.log("[Apply Crop] Square crop complete");
  console.log("==================");
  return croppedWithBorder;
}
