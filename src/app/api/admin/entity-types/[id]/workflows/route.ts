import { NextRequest } from "next/server";
import { updateEntityTypeWorkflows } from "@/features/entity-types/mutations";
import { getWorkflowsByEntityTypeId } from "@/features/entity-types/data";
import { entityTypeWorkflowsUpdateSchema } from "@/features/entity-types/schemas";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { id } = await params;
    console.log("API: Fetching workflows for entity type ID:", id);
    const workflows = await getWorkflowsByEntityTypeId(id);
    console.log("API: Fetched workflows:", workflows, "count:", workflows?.length);
    return ok(workflows);
  } catch (error: any) {
    console.error("Error fetching entity type workflows:", error);
    return serverError("Failed to fetch entity type workflows", error?.message);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { id } = await params;
    const json = await request.json();
    const parsed = entityTypeWorkflowsUpdateSchema.safeParse(json);

    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await updateEntityTypeWorkflows(id, parsed.data.workflows);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error updating entity type workflows:", error);
    return serverError("Failed to update entity type workflows", error?.message);
  }
}
