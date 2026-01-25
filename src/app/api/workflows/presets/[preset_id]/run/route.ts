import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { applyPreset, presetMatchToInputData } from "@/features/workflows/presets/apply-preset";
import { getPresetById } from "@/features/workflows/presets/data";
import { createWorkflowRun } from "@/features/workflows/mutations";
import { executeAutomation } from "@/features/automations/registry";
import { getWorkflowById, getWorkflowSecrets } from "@/features/workflows/data";

export const dynamic = "force-dynamic";

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
    const { entity_type, entity_id } = await req.json();

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: "entity_type and entity_id are required" },
        { status: 400 }
      );
    }

    console.log("[Run Preset] Starting:", preset_id);

    // 1. Apply preset to get matched videos
    const matchResult = await applyPreset(preset_id, entity_id);
    console.log("[Run Preset] Matched videos:", matchResult.total_videos);

    // 2. Convert to input_data
    const inputData = presetMatchToInputData(matchResult);

    // 3. Get workflow
    const workflow = await getWorkflowById(matchResult.preset.workflow_id);
    if (!workflow) {
      throw new Error("Workflow not found");
    }

    if (!workflow.enabled) {
      throw new Error("Workflow is disabled");
    }

    // 4. Create workflow run
    const run = await createWorkflowRun({
      workflow_id: workflow.id,
      entity_type,
      entity_id,
      input_data: inputData,
      estimated_cost: workflow.estimated_cost,
    });

    // 5. Execute (webhook or internal)
    const secrets = await getWorkflowSecrets(workflow.id);

    if (secrets?.webhook_url) {
      // n8n webhook
      fetch(secrets.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secrets.api_key && { Authorization: `Bearer ${secrets.api_key}` }),
        },
        body: JSON.stringify({
          run_id: run.id,
          workflow_id: workflow.id,
          input_data: inputData,
          entity_type,
          entity_id,
        }),
      }).catch((error) => {
        console.error(`[Run Preset] Error triggering webhook for run ${run.id}:`, error);
      });
    } else {
      // Internal execution
      executeAutomation(workflow.slug, run.id, inputData, {
        entityType: entity_type,
        entityId: entity_id,
        workflowId: workflow.id,
      }).catch((error) => {
        console.error(`[Run Preset] Error executing automation for run ${run.id}:`, error);
      });
    }

    return NextResponse.json({
      success: true,
      run_id: run.id,
      matched_videos: matchResult.matched_videos,
      total_videos: matchResult.total_videos,
    });
  } catch (error: any) {
    console.error("[Run Preset] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run preset" },
      { status: 500 }
    );
  }
}
