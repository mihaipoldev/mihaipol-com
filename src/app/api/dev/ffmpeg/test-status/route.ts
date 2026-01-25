import { NextRequest, NextResponse } from "next/server";
import { ffmpegClient } from "@/features/automations/shared/ffmpeg-client";

/**
 * Test endpoint for checking FFmpeg task status
 * Used by the dev testing page
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId parameter" }, { status: 400 });
    }

    const status = await ffmpegClient.getJobStatus(taskId);

    return NextResponse.json(status);
  } catch (error: any) {
    console.error("[Test FFmpeg Status] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
