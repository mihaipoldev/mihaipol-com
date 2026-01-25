import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyPreset } from "@/features/workflows/presets/apply-preset";

export const dynamic = "force-dynamic";

/**
 * Preview what a preset will generate without actually running it
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ preset_id: string }> }
) {
  try {
    const authResult = await requireAdmin(req);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { preset_id } = await params;
    const { entity_id } = await req.json();

    if (!entity_id) {
      return NextResponse.json({ error: "entity_id is required" }, { status: 400 });
    }

    // Apply preset to see what would be matched
    const matchResult = await applyPreset(preset_id, entity_id);

    return NextResponse.json({
      success: true,
      preset_name: matchResult.preset.name,
      matched_videos: matchResult.matched_videos,
      total_videos: matchResult.total_videos,
      video_settings: matchResult.preset.video_settings,
    });
  } catch (error: any) {
    console.error("[Preview Preset] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to preview preset" },
      { status: 500 }
    );
  }
}
