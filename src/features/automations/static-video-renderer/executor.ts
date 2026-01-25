import { BaseExecutor } from "../shared/base-executor";
import { processImageForVideo } from "../image-processor/processor";
import { uploadToStorage } from "../shared/storage";
import { generateVideo } from "./video-generator";
import { getAlbumImageById, getAlbumAudiosByIds } from "@/features/albums/data";
import type { StaticVideoRendererInput } from "./types";

/**
 * Static Video Renderer
 * Renders videos by combining static images with audio tracks
 */
export class StaticVideoRendererExecutor extends BaseExecutor {
  async execute(
    runId: string,
    inputData: any,
    context: { entityType: string; entityId: string; workflowId: string }
  ): Promise<void> {
    console.log(`[Static Video Renderer] Starting execution for run ${runId}`);
    console.log(`[Static Video Renderer] Input data:`, inputData);

    try {
      await this.updateStatus(runId, "running");

      const input = inputData as StaticVideoRendererInput;
      
      // Validate input
      if (!input.videos || !Array.isArray(input.videos) || input.videos.length === 0) {
        throw new Error("No videos array found in input_data or videos array is empty");
      }

      if (!input.quality || !input.aspect_ratio || !input.background_color) {
        throw new Error("Missing required fields: quality, aspect_ratio, or background_color");
      }

      const {
        videos,
        quality,
        aspect_ratio,
        format = "mp4",
        background_color,
      } = input;

      const allResults: any[] = [];
      const errors: string[] = [];
      const taskIds: string[] = []; // Track all task IDs for execution_metadata (production only)
      
      // Detect if we're in development mode (polling) or production (webhooks)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const isDevelopment = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");

      // Process each video configuration
      for (let i = 0; i < videos.length; i++) {
        const videoConfig = videos[i];
        console.log(`[Static Video Renderer] Processing video config ${i + 1}/${videos.length}`);

        try {
          // 1. Fetch image
          const image = await getAlbumImageById(videoConfig.image_id);
          if (!image || !image.image_url) {
            throw new Error(`Image not found: ${videoConfig.image_id}`);
          }

          // 2. Download and process image (REUSE image processor logic)
          console.log(`[Static Video Renderer] Processing image: ${image.title || image.id}`);
          const imageBuffer = await this.downloadFile(image.image_url);

          const { buffer: processedImageBuffer, metadata } = await processImageForVideo(
            imageBuffer,
            {
              quality,
              aspectRatio: aspect_ratio,
              backgroundColor: background_color,
            }
          );

          console.log(`[Static Video Renderer] Image processed:`, metadata);

          // 3. Upload processed image
          const processedImagePath = `static-video-images/${runId}-${videoConfig.image_id}.jpg`;
          const processedImageUrl = await uploadToStorage(
            processedImageBuffer,
            processedImagePath,
            "image/jpeg"
          );

          console.log(`[Static Video Renderer] Processed image uploaded: ${processedImageUrl}`);

          // 4. Fetch tracks if provided
          if (videoConfig.track_ids && videoConfig.track_ids.length > 0) {
            const tracks = await getAlbumAudiosByIds(videoConfig.track_ids);
            console.log(`[Static Video Renderer] Found ${tracks.length} tracks`);

            if (tracks.length === 0) {
              throw new Error(`No tracks found for IDs: ${videoConfig.track_ids.join(", ")}`);
            }

            // 5. Generate video for each track
            for (const track of tracks) {
              console.log(`[Static Video Renderer] Generating video for track: ${track.title || track.id}`);

              // Calculate highlightEnd for short videos
              let highlightEnd: number | undefined = undefined;
              
              if (videoConfig.video_type === "short" && track.highlight_start_time !== null) {
                const startTime = track.highlight_start_time;
                const trackDuration = track.duration || 0;
                
                // For short videos: use 60 seconds from highlight start, or until end of track
                highlightEnd = Math.min(
                  startTime + 60,           // 60 seconds from start
                  trackDuration             // Don't exceed track duration
                );
                
                // Ensure we have at least some duration
                if (highlightEnd <= startTime) {
                  // If highlight start is at or near the end, use remaining duration or 60s
                  highlightEnd = Math.min(startTime + 60, trackDuration);
                }
                
                console.log(`[Static Video Renderer] Short video: start=${startTime}s, end=${highlightEnd}s, duration=${highlightEnd - startTime}s`);
              }

              const result = await generateVideo({
                imageUrl: processedImageUrl,
                audioUrl: track.audio_url,
                videoType: videoConfig.video_type || "long",
                duration: track.duration || 0,
                highlightStart: track.highlight_start_time || undefined,
                highlightEnd,
                format: format as "mp4" | "mov" | "webm",
                quality,
                runId,
              });

              // In development: result is video URL (after polling)
              // In production: result is task_id (webhook updates later)
              if (isDevelopment) {
                // Development mode: video URL returned directly
                console.log(`[Static Video Renderer] Video generated (dev mode): ${result}`);
                allResults.push({
                  track_id: track.id,
                  track_name: track.title,
                  track_number: track.sort_order,
                  video_url: result,
                  image_used: image.title || image.id,
                  video_type: videoConfig.video_type || "long",
                  status: "completed",
                });
              } else {
                // Production mode: task_id returned, webhook will update later
                console.log(`[Static Video Renderer] Video task created (prod mode): ${result}`);
                taskIds.push(result);
                allResults.push({
                  track_id: track.id,
                  track_name: track.title,
                  track_number: track.sort_order,
                  task_id: result,
                  video_url: null, // Will be populated by webhook callback
                  image_used: image.title || image.id,
                  video_type: videoConfig.video_type || "long",
                  status: "pending", // Task is pending, webhook will update when complete
                });
              }
            }
          } else {
            // If no tracks provided, just store the processed image
            allResults.push({
              image_id: videoConfig.image_id,
              processed_image_url: processedImageUrl,
              metadata,
            });
          }
        } catch (error: any) {
          const errorMessage = `Error processing video config ${i + 1}: ${error.message}`;
          console.error(`[Static Video Renderer] ${errorMessage}`, error);
          errors.push(errorMessage);
        }
      }

      // Store task IDs in execution_metadata for webhook lookup (production only)
      if (!isDevelopment && taskIds.length > 0) {
        await this.updateStatus(runId, "running", {
          executionMetadata: {
            ffmpeg_tasks: taskIds,
            processedCount: allResults.length,
            totalCount: videos.length,
          },
        });
      }

      // 6. Complete run
      // In development: videos are complete (polling finished)
      // In production: tasks are async, webhook will update when complete
      if (errors.length > 0 && allResults.length === 0) {
        // All videos failed
        await this.updateStatus(runId, "failed", {
          executionMetadata: {
            ...(taskIds.length > 0 && { ffmpeg_tasks: taskIds }),
            errors,
            processedCount: 0,
            totalCount: videos.length,
          },
        });
        throw new Error(`All videos failed to process: ${errors.join("; ")}`);
      } else if (errors.length > 0) {
        // Some videos failed
        if (isDevelopment) {
          // Development: all videos are complete (some failed)
          console.warn(`[Static Video Renderer] Completed with ${errors.length} errors`);
          await this.updateStatus(runId, "completed", {
            outputFiles: {
              videos: allResults,
              total_videos: allResults.length,
              errors,
              partialSuccess: true,
            },
            executionMetadata: {
              processedCount: allResults.length,
              totalCount: videos.length,
              errors,
            },
          });
        } else {
          // Production: tasks created, waiting for webhooks
          console.warn(`[Static Video Renderer] Completed with ${errors.length} errors. Tasks created: ${taskIds.length}`);
          await this.updateStatus(runId, "running", {
            outputFiles: {
              videos: allResults,
              total_videos: allResults.length,
              errors,
              partialSuccess: true,
              pending_tasks: taskIds.length,
            },
            executionMetadata: {
              ffmpeg_tasks: taskIds,
              processedCount: allResults.length,
              totalCount: videos.length,
              errors,
            },
          });
        }
      } else {
        // All videos succeeded
        if (isDevelopment) {
          // Development: all videos complete
          console.log(`[Static Video Renderer] All videos generated successfully. Total: ${allResults.length}`);
          await this.updateStatus(runId, "completed", {
            outputFiles: {
              videos: allResults,
              total_videos: allResults.length,
            },
            executionMetadata: {
              processedCount: allResults.length,
              totalCount: videos.length,
            },
          });
        } else {
          // Production: tasks created, waiting for webhooks
          console.log(`[Static Video Renderer] All video tasks created successfully. Total: ${allResults.length}. Waiting for webhook callbacks...`);
          await this.updateStatus(runId, "running", {
            outputFiles: {
              videos: allResults,
              total_videos: allResults.length,
              pending_tasks: taskIds.length,
            },
            executionMetadata: {
              ffmpeg_tasks: taskIds,
              processedCount: allResults.length,
              totalCount: videos.length,
            },
          });
          // The webhook handler will update status to "completed" when all tasks finish
        }
      }
    } catch (error: any) {
      console.error(`[Static Video Renderer] Execution failed:`, error);
      await this.handleError(runId, error);
      throw error;
    }
  }
}
