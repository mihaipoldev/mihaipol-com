import { NextRequest, NextResponse } from "next/server";
import { ffmpegClient } from "@/features/automations/shared/ffmpeg-client";

/**
 * Test endpoint for creating FFmpeg tasks
 * Used by the dev testing page
 */
export async function POST(req: NextRequest) {
  console.log("[Test FFmpeg API] ===== Starting test request =====");
  
  try {
    const body = await req.json();
    console.log("[Test FFmpeg API] Request body:", body);
    
    const { imageUrl, audioUrl, duration } = body;

    if (!imageUrl || !audioUrl || !duration) {
      console.error("[Test FFmpeg API] Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: imageUrl, audioUrl, duration" },
        { status: 400 }
      );
    }

    // Check environment variables
    console.log("[Test FFmpeg API] Checking environment variables...");
    console.log("[Test FFmpeg API] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL);
    console.log("[Test FFmpeg API] FFMPEG_API_KEY exists:", !!process.env.FFMPEG_API_KEY);
    
    if (!process.env.FFMPEG_API_KEY) {
      console.error("[Test FFmpeg API] FFMPEG_API_KEY is missing!");
      return NextResponse.json(
        { error: "FFMPEG_API_KEY environment variable is required" },
        { status: 500 }
      );
    }

    console.log("[Test FFmpeg API] Calling ffmpegClient.generateVideo...");
    
    // Use generateVideo which automatically handles dev/prod mode
    // In dev: polls and returns video URL
    // In prod: returns task_id
    const result = await ffmpegClient.generateVideo({
      imageUrl,
      audioUrl,
      duration: parseInt(duration),
      outputFormat: "mp4",
      quality: "1080p", // Default quality for testing
    });

    console.log("[Test FFmpeg API] Got result:", result);

    // Check if result is a URL (dev mode) or task_id (prod mode)
    const isUrl = result.startsWith("http://") || result.startsWith("https://");
    console.log("[Test FFmpeg API] Is URL?", isUrl);

    const response = {
      task_id: isUrl ? null : result,
      video_url: isUrl ? result : null,
      status: isUrl ? "completed" : "pending",
      message: isUrl 
        ? "Video generated successfully (dev mode - polling completed)" 
        : "Task created successfully (prod mode - webhook will update)",
    };
    
    console.log("[Test FFmpeg API] Sending response:", response);
    return NextResponse.json(response);
  } catch (error: any) {
    console.error("[Test FFmpeg API] ===== ERROR CAUGHT =====");
    console.error("[Test FFmpeg API] Error name:", error?.name);
    console.error("[Test FFmpeg API] Error message:", error?.message);
    console.error("[Test FFmpeg API] Error stack:", error?.stack);
    console.error("[Test FFmpeg API] Full error object:", error);
    
    return NextResponse.json({ 
      error: error?.message || "Unknown error",
      details: error?.stack || "No stack trace available"
    }, { status: 500 });
  }
}
