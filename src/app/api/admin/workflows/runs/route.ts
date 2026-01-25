import { NextRequest } from "next/server";
import { createWorkflowRun } from "@/features/workflows/mutations";
import { getWorkflowById, getWorkflowSecrets } from "@/features/workflows/data";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";

const createRunSchema = z.object({
  workflow_id: z.string().uuid(),
  entity_type: z.string(),
  entity_id: z.string().uuid(),
  input_data: z.record(z.string(), z.any()),
});

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    const parsed = createRunSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { workflow_id, entity_type, entity_id, input_data } = parsed.data;

    // Get workflow to fetch estimated_cost
    const workflow = await getWorkflowById(workflow_id);
    if (!workflow) {
      return badRequest("Workflow not found");
    }

    // Create workflow run
    const run = await createWorkflowRun({
      workflow_id,
      entity_type,
      entity_id,
      input_data,
      estimated_cost: workflow.estimated_cost,
    });

    // Get workflow secrets to trigger webhook
    const secrets = await getWorkflowSecrets(workflow_id);
    if (secrets?.webhook_url) {
      try {
        // Trigger n8n webhook asynchronously (don't wait for response)
        fetch(secrets.webhook_url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(secrets.api_key ? { Authorization: `Bearer ${secrets.api_key}` } : {}),
          },
          body: JSON.stringify({
            run_id: run.id,
            workflow_id,
            input_data,
            entity_type,
            entity_id,
          }),
        }).catch((error) => {
          console.error("Error triggering webhook:", error);
          // Don't fail the request if webhook fails
        });
      } catch (error) {
        console.error("Error triggering webhook:", error);
        // Don't fail the request if webhook fails
      }
    }

    return ok(run);
  } catch (error: any) {
    console.error("Error creating workflow run:", error);
    return serverError("Failed to create workflow run", error?.message);
  }
}

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (!entityType || !entityId) {
      return badRequest("entity_type and entity_id query parameters are required");
    }

    const { getWorkflowRunsByEntity } = await import("@/features/workflows/data");
    const runs = await getWorkflowRunsByEntity(entityType, entityId, limit);

    return ok(runs);
  } catch (error: any) {
    console.error("Error fetching workflow runs:", error);
    return serverError("Failed to fetch workflow runs", error?.message);
  }
}
