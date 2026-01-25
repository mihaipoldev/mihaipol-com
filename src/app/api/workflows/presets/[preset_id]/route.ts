import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { validatePreset } from "@/features/workflows/presets/validation";
import type { WorkflowPreset } from "@/features/workflows/presets/types";

export const dynamic = "force-dynamic";

/**
 * Update an existing preset
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ preset_id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { preset_id } = await params;
    const body = await request.json();

    // Validate preset data
    const validationErrors = validatePreset(body);
    if (validationErrors) {
      return NextResponse.json(
        { error: "Validation failed", details: validationErrors },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabaseClient();

    // Prepare matching_config - handle "no filter" checkboxes
    const matchingConfig: any = {
      image_selection: {
        filter: {},
      },
      track_grouping: {
        group_by: body.matching_config.track_grouping.group_by === "none" 
          ? null 
          : body.matching_config.track_grouping.group_by || null,
        strategy: body.matching_config.track_grouping.strategy,
      },
    };

    // Only include content_type if not filtered out
    if (!body.no_filter_type && body.matching_config.image_selection.filter?.content_type) {
      matchingConfig.image_selection.filter.content_type =
        body.matching_config.image_selection.filter.content_type;
    }

    // Only include content_group if not filtered out
    if (!body.no_filter_group && body.matching_config.image_selection.filter?.content_group) {
      matchingConfig.image_selection.filter.content_group =
        body.matching_config.image_selection.filter.content_group;
    }

    // If no filters, remove filter object
    if (Object.keys(matchingConfig.image_selection.filter).length === 0) {
      matchingConfig.image_selection.filter = undefined;
    }

    const { data, error } = await supabase
      .from("workflow_presets")
      .update({
        name: body.name.trim(),
        description: body.description?.trim() || null,
        icon: body.icon?.trim() || null,
        matching_config: matchingConfig,
        video_settings: body.video_settings,
        enabled: body.enabled !== undefined ? body.enabled : true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", preset_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, preset: data as WorkflowPreset });
  } catch (error: any) {
    console.error("[Update Preset] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update preset" },
      { status: 500 }
    );
  }
}

/**
 * Delete a preset
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ preset_id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { preset_id } = await params;
    const supabase = getServiceSupabaseClient();

    const { error } = await supabase.from("workflow_presets").delete().eq("id", preset_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Delete Preset] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete preset" },
      { status: 500 }
    );
  }
}
