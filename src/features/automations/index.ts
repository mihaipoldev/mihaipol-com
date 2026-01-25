export type { ImageMetadata } from "./types";
export type { ImageProcessorInput, ImageProcessorOutput } from "./image-processor/types";
export type { ExecutorContext } from "./shared/base-executor";

// Export executors
export { ImageProcessorExecutor } from "./image-processor/executor";
export { StaticVideoRendererExecutor } from "./static-video-renderer/executor";

// Export registry functions
export { executeAutomation, hasExecutor, getAvailableExecutors } from "./registry";

// Export shared utilities
export { uploadToStorage } from "./shared/storage";
export { ffmpegClient } from "./shared/ffmpeg-client";
export { generateVideo } from "./static-video-renderer/video-generator";
export { processImageForVideo } from "./image-processor/processor";
