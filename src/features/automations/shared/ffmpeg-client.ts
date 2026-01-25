/**
 * FFmpeg API Client for ffmpeg-api.com
 * Automatically uses polling (dev) or webhooks (prod)
 * 
 * API Flow:
 * 1. Create file entries (POST /file) to get presigned upload URLs
 * 2. Upload file bytes to presigned URLs  
 * 3. Submit task (POST /ffmpeg/process/async) using file_path references
 * 4. Poll for status (GET /job/:jobId) or wait for webhook
 */

import { getVideoCRF } from "../static-video-renderer/utils";

interface FileCreateRequest {
  dir_id?: string; // Optional, creates temporary dir if omitted
  file_name: string;
}

interface FileCreateResponse {
  ok: boolean;
  file: {
    file_name: string;
    added_on: string;
    dir_id: string;
    file_type: string | null;
    file_size: number | null;
    file_path: string; // e.g. "dir_abc123/image.jpg"
  };
  upload: {
    url: string; // Presigned S3 URL
    method: string;
    headers: Record<string, string>;
    expiresInSeconds: number;
  };
}

interface TaskInput {
  file_path: string; // From file creation
  options?: string[]; // FFmpeg input options
}

interface TaskOutput {
  file: string; // Output filename
  options?: string[]; // FFmpeg output options
}

interface ProcessAsyncRequest {
  task: {
    inputs: TaskInput[];
    outputs: TaskOutput[];
  };
  webhook_url?: string;
  webhook_secret?: string;
}

interface ProcessAsyncResponse {
  job_id: string; // Use this to poll for status
}

interface JobStatusResponse {
  ok?: boolean;
  job_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: Array<{
    file_name: string;
    size_bytes: number;
    download_url: string; // This is the video URL!
  }>;
  usage?: {
    time_sec: number;
    input_size_gb: number;
    output_size_gb: number;
    gb_sec: number;
  };
  error?: string;
  created_at?: string;
  completed_at?: string;
}

class FFmpegClient {
  private apiUrl = "https://api.ffmpeg-api.com";
  private apiKey: string;
  private isDevelopment: boolean;
  private webhookUrl?: string;
  private webhookSecret?: string;

  constructor() {
    console.log("[FFmpeg Client] ===== Initializing FFmpeg Client =====");
    
    const key = process.env.FFMPEG_API_KEY;
    console.log("[FFmpeg Client] FFMPEG_API_KEY exists:", !!key);
    console.log("[FFmpeg Client] FFMPEG_API_KEY length:", key?.length || 0);
    
    if (!key) {
      const error = new Error("FFMPEG_API_KEY environment variable is required");
      console.error("[FFmpeg Client] Initialization failed:", error);
      throw error;
    }

    this.apiKey = key;
    
    // Detect if we're in development (localhost)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    console.log("[FFmpeg Client] NEXT_PUBLIC_APP_URL:", appUrl);
    
    this.isDevelopment = appUrl.includes("localhost") || appUrl.includes("127.0.0.1");
    console.log("[FFmpeg Client] isDevelopment:", this.isDevelopment);
    
    if (!this.isDevelopment) {
      this.webhookUrl = `${appUrl}/api/webhooks/ffmpeg`;
      this.webhookSecret = process.env.FFMPEG_WEBHOOK_SECRET;
      console.log("[FFmpeg Client] Production mode - webhook URL:", this.webhookUrl);
      console.log("[FFmpeg Client] Webhook secret exists:", !!this.webhookSecret);
    }

    console.log(`[FFmpeg Client] Mode: ${this.isDevelopment ? "DEVELOPMENT (polling)" : "PRODUCTION (webhooks)"}`);
    console.log("[FFmpeg Client] ===== Initialization complete =====");
  }

  /**
   * Upload a file from URL to FFmpeg API
   */
  private async uploadFileFromUrl(url: string, fileName: string, dirId?: string): Promise<string> {
    console.log(`[FFmpeg Client] Uploading file: ${fileName} from ${url}`);
    
    // 1. Create file entry
    const fileCreateResponse = await fetch(`${this.apiUrl}/file`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${this.apiKey}`,
      },
      body: JSON.stringify({
        file_name: fileName,
        ...(dirId && { dir_id: dirId }),
      } as FileCreateRequest),
    });

    console.log(`[FFmpeg Client] File create response status: ${fileCreateResponse.status}`);

    if (!fileCreateResponse.ok) {
      const errorText = await fileCreateResponse.text();
      console.error(`[FFmpeg Client] File create error: ${errorText}`);
      throw new Error(`Failed to create file entry: ${fileCreateResponse.status} - ${errorText}`);
    }

    const fileData: FileCreateResponse = await fileCreateResponse.json();
    console.log(`[FFmpeg Client] File creation response:`, JSON.stringify(fileData, null, 2));
    console.log(`[FFmpeg Client] File entry created: ${fileData.file.file_path}`);

    // Validate response
    if (!fileData.upload?.url) {
      throw new Error(`File creation response missing upload.url. Response: ${JSON.stringify(fileData)}`);
    }

    // 2. Download file from source URL
    const downloadResponse = await fetch(url);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download file from ${url}: ${downloadResponse.status}`);
    }
    const fileBuffer = await downloadResponse.arrayBuffer();
    console.log(`[FFmpeg Client] Downloaded file: ${fileBuffer.byteLength} bytes`);

    // 3. Upload to presigned URL
    const uploadHeaders: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      ...fileData.upload.headers,
    };

    const uploadResponse = await fetch(fileData.upload.url, {
      method: "PUT",
      headers: uploadHeaders,
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Failed to upload file: ${uploadResponse.status} - ${errorText}`);
    }

    console.log(`[FFmpeg Client] File uploaded successfully: ${fileData.file.file_path}`);
    return fileData.file.file_path;
  }

  /**
   * Generate a video - handles both polling and webhook modes automatically
   * Development: polls and returns video URL
   * Production: returns job_id (webhook updates later)
   */
  async generateVideo(options: {
    imageUrl: string;
    audioUrl: string;
    duration: number;
    audioStart?: number;
    outputFormat: "mp4" | "mov" | "webm";
    quality: "720p" | "1080p" | "4k";
  }): Promise<string> {
    console.log("[FFmpeg Client] Generating video:", options);

    try {
      // 1. Upload files
      // Important: Both files must be in the same directory for FFmpeg processing
      console.log("[FFmpeg Client] Step 1: Uploading files...");
      const imagePath = await this.uploadFileFromUrl(options.imageUrl, `image.${options.imageUrl.split('.').pop() || 'jpg'}`);
      
      // Extract directory ID from image path (e.g., "dir_abc/image.jpg" -> "dir_abc")
      const dirId = imagePath.split('/')[0];
      
      // Upload audio to the same directory
      const audioPath = await this.uploadFileFromUrl(options.audioUrl, `audio.${options.audioUrl.split('.').pop() || 'mp3'}`, dirId);

      // 2. Build FFmpeg task
      // According to FFmpeg API docs:
      // - Input options (like -ss, -t, -loop) go in inputs[].options[]
      // - Output options (like -c:v, -c:a, -pix_fmt) go in outputs[].options[]
      console.log("[FFmpeg Client] Step 2: Building task...");
      
      // Get CRF based on quality
      const crf = getVideoCRF(options.quality);
      
      // Image input: loop the image
      const imageInputOptions: string[] = ["-loop", "1"];
      
      // Audio input: seek to start position and limit duration
      const audioInputOptions: string[] = [
        ...(options.audioStart ? ["-ss", options.audioStart.toString()] : []),
        "-t", options.duration.toString(),
      ];
      
      // Output options: codec settings with quality control
      const outputOptions: string[] = [
        "-c:v", "libx264",
        "-crf", crf.toString(),        // Quality control based on resolution
        "-preset", "medium",           // Encoding speed/quality tradeoff
        "-c:a", "aac",
        "-b:a", "192k",                // Audio bitrate for good quality
        "-pix_fmt", "yuv420p",        // Compatible pixel format
        "-shortest",                   // End when shortest input ends
      ];

      console.log("[FFmpeg Client] Output options:", {
        crf,
        quality: options.quality,
        preset: "medium",
        audioBitrate: "192k",
      });

      const request: ProcessAsyncRequest = {
        task: {
          inputs: [
            { file_path: imagePath, options: imageInputOptions },
            { file_path: audioPath, options: audioInputOptions },
          ],
          outputs: [
            { 
              file: `output.${options.outputFormat}`, 
              options: outputOptions 
            },
          ],
        },
      };

      // Add webhook only in production
      if (!this.isDevelopment && this.webhookUrl) {
        request.webhook_url = this.webhookUrl;
        request.webhook_secret = this.webhookSecret;
      }

      // 3. Submit task
      console.log("[FFmpeg Client] Step 3: Submitting task...");
      const jobId = await this.createProcessingJob(request);

      // 4. In development: poll for result
      //    In production: return job_id (webhook will update later)
      if (this.isDevelopment) {
        console.log("[FFmpeg Client] Development mode - polling for result...");
        return await this.pollForResult(jobId);
      } else {
        console.log("[FFmpeg Client] Production mode - webhook will notify when complete");
        return jobId; // Return job_id, webhook will provide video_url later
      }
    } catch (error: any) {
      console.error("[FFmpeg Client] Video generation failed:", error);
      throw error;
    }
  }

  /**
   * Create a processing job
   */
  private async createProcessingJob(request: ProcessAsyncRequest): Promise<string> {
    console.log("[FFmpeg Client] Creating processing job...");
    console.log("[FFmpeg Client] Request:", JSON.stringify(request, null, 2));

    const response = await fetch(`${this.apiUrl}/ffmpeg/process/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[FFmpeg Client] Error creating job:", errorText);
      throw new Error(`FFmpeg API error: ${response.status} - ${errorText}`);
    }

    const result: ProcessAsyncResponse = await response.json();
    console.log("[FFmpeg Client] Job created successfully:", result.job_id);

    return result.job_id;
  }

  /**
   * Poll for job completion (development mode only)
   */
  private async pollForResult(jobId: string, maxAttempts: number = 75): Promise<string> {
    const pollIntervalSeconds = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      // Wait 10 seconds between polls
      await new Promise(resolve => setTimeout(resolve, pollIntervalSeconds * 1000));

      console.log(`[FFmpeg Client] Polling attempt ${attempts}/${maxAttempts}...`);

      const status = await this.getJobStatus(jobId);

      if (status.status === "completed") {
        if (!status.result || status.result.length === 0 || !status.result[0]?.download_url) {
          throw new Error("Job completed but no download_url in result");
        }
        const videoUrl = status.result[0].download_url;
        console.log("[FFmpeg Client] Video ready:", videoUrl);
        return videoUrl;
      }

      if (status.status === "failed") {
        throw new Error(`FFmpeg job failed: ${status.error || "Unknown error"}`);
      }

      // Status is still "pending" or "processing", continue polling
    }

    throw new Error(`FFmpeg job timed out after ${maxAttempts * pollIntervalSeconds} seconds`);
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${this.apiUrl}/job/${jobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Basic ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<void> {
    await fetch(`${this.apiUrl}/job/${jobId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Basic ${this.apiKey}`,
      },
    });
  }
}

// Lazy singleton initialization - only creates client when first accessed
let clientInstance: FFmpegClient | null = null;

function getFFmpegClient(): FFmpegClient {
  if (!clientInstance) {
    clientInstance = new FFmpegClient();
  }
  return clientInstance;
}

// Export singleton getter
export const ffmpegClient = {
  get generateVideo() {
    return getFFmpegClient().generateVideo.bind(getFFmpegClient());
  },
  get getJobStatus() {
    return getFFmpegClient().getJobStatus.bind(getFFmpegClient());
  },
  get cancelJob() {
    return getFFmpegClient().cancelJob.bind(getFFmpegClient());
  },
};

// Export types
export type { ProcessAsyncRequest, JobStatusResponse };
