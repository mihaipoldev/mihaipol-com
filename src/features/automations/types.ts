export type ImageMetadata = {
  originalSize: {
    width: number;
    height: number;
  };
  finalSize: {
    width: number;
    height: number;
  };
  processingTime: number;
};

// Re-export from subdirectories
export type { ImageProcessorInput, ImageProcessorOutput } from "./image-processor/types";
