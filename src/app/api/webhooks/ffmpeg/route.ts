import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { updateWorkflowRunStatus } from "@/features/workflows/mutations";

/**
 * Webhook receiver for FFmpeg API callbacks (PRODUCTION ONLY)
 * In development, polling is used instead of webhooks
 */
export async function POST(req: NextRequest) {
  try {
    // Verify webhook secret for security
    const providedSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = process.env.FFMPEG_WEBHOOK_SECRET;

    if (expectedSecret && providedSecret !== expectedSecret) {
      console.error("[FFmpeg Webhook] Invalid webhook secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    
    console.log("[FFmpeg Webhook] Received callback:", body);

    const { task_id, status, output_url, error } = body;

    if (!task_id) {
      return NextResponse.json({ error: "Missing task_id" }, { status: 400 });
    }

    const supabase = getServiceSupabaseClient();

    // Find the workflow_run that created this task
    // We need to search execution_metadata for the task_id in ffmpeg_tasks array
    // Since Supabase doesn't have direct array contains for JSONB, we'll query recent runs
    // and filter in code, or use a more efficient approach
    
    // Query recent workflow runs (last 24 hours) to find the one with this task_id
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const { data: runs, error: queryError } = await supabase
      .from("workflow_runs")
      .select("*")
      .gte("started_at", oneDayAgo.toISOString())
      .order("started_at", { ascending: false })
      .limit(100);

    if (queryError) {
      console.error("[FFmpeg Webhook] Error querying runs:", queryError);
      return NextResponse.json({ error: "Database query failed" }, { status: 500 });
    }

    // Find the run that contains this task_id in execution_metadata.ffmpeg_tasks
    const run = runs?.find((r) => {
      const metadata = r.execution_metadata as any;
      const ffmpegTasks = metadata?.ffmpeg_tasks || [];
      return Array.isArray(ffmpegTasks) && ffmpegTasks.includes(task_id);
    });

    if (!run) {
      console.error("[FFmpeg Webhook] No run found for task:", task_id);
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (status === "completed" && output_url) {
      // Task succeeded - update run with video URL
      const currentOutput = (run.output_files as any) || { videos: [] };
      const videos = currentOutput.videos || [];
      
      // Find the video entry with this task_id and update it, or add a new one
      const videoIndex = videos.findIndex((v: any) => v.task_id === task_id);
      
      if (videoIndex >= 0) {
        // Update existing video entry
        videos[videoIndex] = {
          ...videos[videoIndex],
          video_url: output_url,
          completed_at: new Date().toISOString(),
          status: "completed",
        };
      } else {
        // Add new video entry
        videos.push({
          task_id,
          video_url: output_url,
          completed_at: new Date().toISOString(),
          status: "completed",
        });
      }

      // Check if all tasks are complete
      const metadata = (run.execution_metadata as any) || {};
      const ffmpegTasks = metadata.ffmpeg_tasks || [];
      const completedVideos = videos.filter((v: any) => v.status === "completed" && v.video_url);
      const allTasksComplete = ffmpegTasks.length > 0 && completedVideos.length >= ffmpegTasks.length;

      // Update output_files
      const updatedOutput = {
        ...currentOutput,
        videos,
      };

      // If all tasks are complete, mark run as completed
      if (allTasksComplete && run.status === "running") {
        await updateWorkflowRunStatus(run.id, "completed", {
          outputFiles: updatedOutput,
          executionMetadata: {
            ...metadata,
            all_tasks_completed_at: new Date().toISOString(),
          },
        });
        console.log("[FFmpeg Webhook] All tasks completed, run marked as completed:", run.id);
      } else {
        // Just update output_files
        const { error: updateError } = await supabase
          .from("workflow_runs")
          .update({
            output_files: updatedOutput,
          })
          .eq("id", run.id);

        if (updateError) {
          console.error("[FFmpeg Webhook] Error updating run:", updateError);
          return NextResponse.json({ error: "Failed to update run" }, { status: 500 });
        }
      }

      console.log("[FFmpeg Webhook] Video added to run:", run.id);
    } else if (status === "failed") {
      // Task failed - log error
      console.error("[FFmpeg Webhook] Task failed:", task_id, error);
      
      const currentMetadata = (run.execution_metadata as any) || {};
      const ffmpegErrors = currentMetadata.ffmpeg_errors || [];
      
      // Update video entry status to failed
      const currentOutput = (run.output_files as any) || { videos: [] };
      const videos = currentOutput.videos || [];
      const videoIndex = videos.findIndex((v: any) => v.task_id === task_id);
      
      if (videoIndex >= 0) {
        videos[videoIndex] = {
          ...videos[videoIndex],
          status: "failed",
          error,
          failed_at: new Date().toISOString(),
        };
      }

      const { error: updateError } = await supabase
        .from("workflow_runs")
        .update({
          output_files: {
            ...currentOutput,
            videos,
          },
          execution_metadata: {
            ...currentMetadata,
            ffmpeg_errors: [
              ...ffmpegErrors,
              { task_id, error, failed_at: new Date().toISOString() },
            ],
          },
        })
        .eq("id", run.id);

      if (updateError) {
        console.error("[FFmpeg Webhook] Error updating run with error:", updateError);
        return NextResponse.json({ error: "Failed to update run" }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[FFmpeg Webhook] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
