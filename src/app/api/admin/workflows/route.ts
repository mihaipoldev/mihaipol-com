import { NextRequest } from "next/server";
import { getWorkflowsByEntityTypeSlug, getAllWorkflowsIncludingDisabled } from "@/features/workflows/data";
import { createWorkflow, updateWorkflow } from "@/features/workflows/mutations";
import { workflowCreateSchema, workflowUpdateSchema } from "@/features/workflows/schemas";
import { ok, badRequest, serverError, created } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const enabled = searchParams.get("enabled");

    // If entity_type is provided, fetch workflows for that entity type
    if (entityType) {
      const workflows = await getWorkflowsByEntityTypeSlug(entityType);
      return ok(workflows);
    }

    // Otherwise, fetch all workflows
    // If enabled=true is specified, filter to only enabled workflows
    let workflows;
    if (enabled === "true") {
      const allWorkflows = await getAllWorkflowsIncludingDisabled();
      workflows = allWorkflows.filter(w => w.enabled === true);
    } else {
      workflows = await getAllWorkflowsIncludingDisabled();
    }

    return ok(workflows);
  } catch (error: any) {
    console.error("Error fetching workflows:", error);
    return serverError("Failed to fetch workflows", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    const parsed = workflowCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const data = await createWorkflow(parsed.data);
    return created(data);
  } catch (error: any) {
    console.error("Error creating workflow:", error);
    return serverError("Failed to create workflow", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    console.log("=== SERVER: PUT /api/admin/workflows ===");
    console.log("Received payload:", JSON.stringify(json, null, 2));
    
    // Log the schema to make sure it's loaded
    console.log("workflowUpdateSchema type:", typeof workflowUpdateSchema);
    console.log("workflowUpdateSchema keys:", Object.keys(workflowUpdateSchema || {}));
    
    try {
      const parsed = workflowUpdateSchema.safeParse(json);
      console.log("Validation result:", parsed);
      
      if (!parsed.success) {
        console.error("=== SERVER: Validation failed ===");
        console.error("Error details:", JSON.stringify(parsed.error.flatten(), null, 2));
        return badRequest("Invalid payload", parsed.error.flatten());
      }

      const { id, ...updates } = parsed.data;
      console.log("=== SERVER: Validation passed ===");
      console.log("Workflow ID:", id);
      console.log("Updates:", JSON.stringify(updates, null, 2));
      
      const data = await updateWorkflow(id, updates);
      console.log("=== SERVER: Update successful ===");
      return ok(data);
    } catch (validationError: any) {
      console.error("=== SERVER: Exception during validation ===");
      console.error("Error:", validationError);
      console.error("Stack:", validationError?.stack);
      throw validationError;
    }
  } catch (error: any) {
    console.error("=== SERVER: Error updating workflow ===");
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    return serverError("Failed to update workflow", error?.message);
  }
}
