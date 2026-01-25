import { ImageProcessorExecutor } from "./image-processor/executor";
import { StaticVideoRendererExecutor } from "./static-video-renderer/executor";
import type { ExecutorContext, BaseExecutor } from "./shared/base-executor";

/**
 * Executor context passed to each automation executor
 */
export type { ExecutorContext } from "./shared/base-executor";

/**
 * Registry mapping workflow slugs to executor instances
 */
const executors: Record<string, BaseExecutor> = {
  "image-processor": new ImageProcessorExecutor(),
  "static-video-renderer": new StaticVideoRendererExecutor(),
};

/**
 * Execute an automation based on workflow slug
 * @param workflowSlug - The workflow slug (e.g., "static-video-renderer", "image-processor")
 * @param runId - The workflow run ID
 * @param inputData - The input data from the form
 * @param context - Execution context (entityType, entityId, workflowId)
 * @throws Error if no executor is found for the given slug
 */
export async function executeAutomation(
  workflowSlug: string,
  runId: string,
  inputData: Record<string, any>,
  context: ExecutorContext
): Promise<void> {
  console.log(`[Automation Registry] ====== START ======`);
  console.log(`[Automation Registry] Looking up executor for slug: "${workflowSlug}"`);
  console.log(`[Automation Registry] Available executors:`, getAvailableExecutors());
  
  const executor = executors[workflowSlug];
  if (!executor) {
    const error = new Error(`No executor found for workflow slug: ${workflowSlug}`);
    console.error(`[Automation Registry] ${error.message}`);
    console.error(`[Automation Registry] Available executors:`, getAvailableExecutors());
    throw error;
  }

  console.log(`[Automation Registry] Executor found for: ${workflowSlug}`);
  console.log(`[Automation Registry] Execution context:`, {
    runId,
    workflowSlug,
    context,
    inputDataKeys: Object.keys(inputData),
  });

  try {
    await executor.execute(runId, inputData, context);
    console.log(`[Automation Registry] ====== SUCCESS ======`);
  } catch (error: any) {
    console.error(`[Automation Registry] ====== ERROR ======`);
    console.error(`[Automation Registry] Executor error:`, error);
    console.error(`[Automation Registry] Error message:`, error?.message);
    console.error(`[Automation Registry] Error stack:`, error?.stack);
    throw error;
  }
}

/**
 * Check if an executor exists for a given workflow slug
 */
export function hasExecutor(workflowSlug: string): boolean {
  return workflowSlug in executors;
}

/**
 * Get list of available executor slugs
 */
export function getAvailableExecutors(): string[] {
  return Object.keys(executors);
}
