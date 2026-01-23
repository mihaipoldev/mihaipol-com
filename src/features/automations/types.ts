export type ProcessingState = "idle" | "uploading" | "processing" | "success" | "error";

export type ProcessingFormat = "youtube" | "instagram" | "story";

export type ArtworkShape = "circle" | "square";

export type CircleInfo = {
  isCircular: boolean;
  radius: number;
  center: { x: number; y: number };
  confidence: number; // 0-1, how sure we are it's a circle
};

export type ImageMetadata = {
  originalSize: {
    width: number;
    height: number;
  };
  trimmedSize: {
    width: number;
    height: number;
  };
  finalSize: {
    width: number;
    height: number;
  };
  processingTime: number;
  shapeProcessing?: {
    shape: ArtworkShape;
    detectedAsCircular: boolean;
    method: "extracted" | "masked" | "preserved";
  };
  aiCropInfo?: {
    used: boolean;
    reasoning?: string;
    fallbackReason?: string;
    rawResponse?: string; // Raw AI response for debugging
    cropCoordinates?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
  };
};

export type ProcessedImageResult = {
  success: boolean;
  processedImageUrl: string; // Base64 data URL
  metadata: ImageMetadata;
  error?: string;
  method?: "n8n" | "ai"; // Processing method used
};

export type ProcessingStep = {
  id: string;
  label: string;
  status: "pending" | "processing" | "completed" | "error";
};

export type CropRecommendation = {
  top: number; // 0-1 scale (0 = top edge, 1 = bottom edge)
  bottom: number; // 0-1 scale
  left: number; // 0-1 scale (0 = left edge, 1 = right edge)
  right: number; // 0-1 scale
  reasoning: string; // AI explanation
};
