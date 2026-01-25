import { updateWorkflowRunStatus } from "@/features/workflows/mutations";
import type { WorkflowRunStatus } from "@/features/workflows/types/workflow.types";

export type ExecutorContext = {
  entityType: string;
  entityId: string;
  workflowId: string;
};

/**
 * Abstract base class for all automation executors
 * Provides common functionality for status updates, error handling, and file downloads
 */
export abstract class BaseExecutor {
  /**
   * Main execution method - must be implemented by each executor
   */
  abstract execute(
    runId: string,
    inputData: any,
    context: ExecutorContext
  ): Promise<void>;

  /**
   * Update workflow run status
   */
  protected async updateStatus(
    runId: string,
    status: WorkflowRunStatus,
    data?: {
      outputFiles?: Record<string, any> | null;
      executionMetadata?: Record<string, any> | null;
      actualCost?: number | null;
    }
  ): Promise<void> {
    await updateWorkflowRunStatus(runId, status, {
      outputFiles: data?.outputFiles,
      executionMetadata: data?.executionMetadata,
      actualCost: data?.actualCost,
    });

    console.log(`[Executor] Updated run ${runId} status to: ${status}`);
  }

  /**
   * Handle execution errors
   */
  protected async handleError(runId: string, error: any): Promise<void> {
    console.error(`[Executor] Error in run ${runId}:`, error);

    await this.updateStatus(runId, "failed", {
      executionMetadata: {
        error: {
          message: error.message || "Unknown error",
          stack: error.stack,
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  /**
   * Download file from URL to Buffer
   */
  protected async downloadFile(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }
}
