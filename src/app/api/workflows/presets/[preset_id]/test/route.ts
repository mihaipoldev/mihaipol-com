import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyPreset } from "@/features/workflows/presets/apply-preset";

export const dynamic = "force-dynamic";

/**
 * Test a preset against an album
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ preset_id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { preset_id } = await params;
    const { album_id } = await request.json();

    if (!album_id) {
      return NextResponse.json({ error: "album_id is required" }, { status: 400 });
    }

    // Apply preset to see what would be matched
    const matchResult = await applyPreset(preset_id, album_id);

    return NextResponse.json({
      success: true,
      matched_videos: matchResult.matched_videos,
      total_videos: matchResult.total_videos,
      video_settings: matchResult.preset.video_settings,
      message: `This preset would generate ${matchResult.total_videos} video(s)`,
    });
  } catch (error: any) {
    console.error("[Test Preset] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to test preset" },
      { status: 500 }
    );
  }
}
