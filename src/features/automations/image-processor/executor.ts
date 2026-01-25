import { BaseExecutor } from "../shared/base-executor";
import { processImageForVideo } from "./processor";
import { uploadToStorage } from "../shared/storage";
import { getAlbumImageById } from "@/features/albums/data";
import type { ImageProcessorInput, ImageProcessorOutput } from "./types";

/**
 * Standalone image processor automation
 * Processes images for video with aspect ratio, quality, and background options
 */
export class ImageProcessorExecutor extends BaseExecutor {
  async execute(
    runId: string,
    inputData: ImageProcessorInput,
    context: { entityType: string; entityId: string; workflowId: string }
  ): Promise<void> {
    console.log(`[Image Processor] Starting execution for run ${runId}`);
    console.log(`[Image Processor] Input:`, inputData);

    try {
      await this.updateStatus(runId, "running");

      const { image_id, quality, aspect_ratio, background_color } = inputData;

      // 1. Fetch image from database
      console.log(`[Image Processor] Fetching image: ${image_id}`);
      const image = await getAlbumImageById(image_id);

      if (!image) {
        throw new Error(`Image not found: ${image_id}`);
      }

      console.log(`[Image Processor] Image found:`, {
        id: image.id,
        url: image.image_url,
        title: image.title,
      });

      // 2. Download image
      console.log(`[Image Processor] Downloading image from: ${image.image_url}`);
      const imageBuffer = await this.downloadFile(image.image_url);
      console.log(`[Image Processor] Downloaded ${imageBuffer.length} bytes`);

      // 3. Process image
      console.log(`[Image Processor] Processing image with Sharp...`);
      const { buffer: processedBuffer, metadata } = await processImageForVideo(
        imageBuffer,
        {
          quality,
          aspectRatio: aspect_ratio,
          backgroundColor: background_color,
        }
      );
      console.log(`[Image Processor] Processing complete:`, metadata);

      // 4. Upload processed image
      const filename = `processed-images/${runId}-${image_id}.jpg`;
      console.log(`[Image Processor] Uploading to: ${filename}`);
      const processedUrl = await uploadToStorage(
        processedBuffer,
        filename,
        "image/jpeg"
      );

      // 5. Complete run with output
      const output: ImageProcessorOutput = {
        processed_image_url: processedUrl,
        metadata,
      };

      console.log(`[Image Processor] Execution completed successfully`);
      await this.updateStatus(runId, "completed", {
        outputFiles: output,
      });
    } catch (error: any) {
      console.error(`[Image Processor] Execution failed:`, error);
      await this.handleError(runId, error);
      throw error;
    }
  }
}
