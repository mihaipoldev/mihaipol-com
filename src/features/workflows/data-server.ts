import { getWorkflowsByEntityTypeSlug } from "@/features/workflows/data";
import { getPresetsForEntity } from "@/features/workflows/presets/data";
import { getWorkflowRunsByEntity } from "@/features/workflows/data";
import type { Workflow } from "@/features/workflows/types";
import type { WorkflowPreset } from "@/features/workflows/presets/types";
import type { WorkflowRun } from "@/features/workflows/types/workflow.types";

export type EntityWorkflowData = {
  workflows: Workflow[];
  presets: WorkflowPreset[];
  runs: WorkflowRun[];
};

/**
 * Server-side function to fetch workflows, presets, and runs for an entity
 * Used for pre-fetching data on the server to avoid client-side loading delays
 */
export async function getEntityWorkflowDataServer(
  entityType: string,
  entityId: string | null,
  runsLimit: number = 10
): Promise<EntityWorkflowData> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();

  try {
    // Fetch all data in parallel (much faster than sequential!)
    const [workflows, presets, runs] = await Promise.all([
      getWorkflowsByEntityTypeSlug(entityType),
      getPresetsForEntity(entityType),
      entityId ? getWorkflowRunsByEntity(entityType, entityId, runsLimit) : Promise.resolve([]),
    ]);

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    // Performance monitoring
    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY: getEntityWorkflowDataServer took ${totalTime.toFixed(0)}ms`
      );
    } else if (totalTime > 100) {
      console.log(
        `[DB] getEntityWorkflowDataServer: ${totalTime.toFixed(2)}ms (workflows: ${workflows.length}, presets: ${presets.length}, runs: ${runs.length})`
      );
    }

    return {
      workflows,
      presets,
      runs,
    };
  } catch (error: any) {
    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
    console.error(
      `Error fetching entity workflow data server-side (took ${totalTime.toFixed(2)}ms):`,
      error
    );
    // Return empty arrays on error so the page still loads
    return {
      workflows: [],
      presets: [],
      runs: [],
    };
  }
}
