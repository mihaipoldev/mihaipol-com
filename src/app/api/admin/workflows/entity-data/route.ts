import { NextRequest } from "next/server";
import { getWorkflowsByEntityTypeSlug } from "@/features/workflows/data";
import { getPresetsForEntity } from "@/features/workflows/presets/data";
import { getWorkflowRunsByEntity } from "@/features/workflows/data";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Combined endpoint that fetches workflows, presets, and runs for an entity in parallel
 * This reduces 3 separate API calls to 1, significantly improving performance
 */
export async function GET(request: NextRequest) {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entity_type");
    const entityId = searchParams.get("entity_id");
    const runsLimit = parseInt(searchParams.get("runs_limit") || "10", 10);

    if (!entityType) {
      return badRequest("entity_type query parameter is required");
    }

    // Fetch all data in parallel (much faster than sequential!)
    const [workflows, presets, runs] = await Promise.all([
      getWorkflowsByEntityTypeSlug(entityType),
      getPresetsForEntity(entityType),
      entityId ? getWorkflowRunsByEntity(entityType, entityId, runsLimit) : Promise.resolve([]),
    ]);

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    // Performance monitoring
    if (totalTime > 1000) {
      console.warn(
        `⚠️ [API] SLOW ENDPOINT: /api/admin/workflows/entity-data took ${totalTime.toFixed(0)}ms`
      );
    } else if (totalTime > 200) {
      console.log(
        `[API] /api/admin/workflows/entity-data: ${totalTime.toFixed(2)}ms (workflows: ${workflows.length}, presets: ${presets.length}, runs: ${runs.length})`
      );
    }

    return ok({
      workflows,
      presets,
      runs,
    });
  } catch (error: any) {
    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
    console.error(
      `Error fetching entity workflow data (took ${totalTime.toFixed(2)}ms):`,
      error
    );
    return serverError("Failed to fetch entity workflow data", error?.message);
  }
}
