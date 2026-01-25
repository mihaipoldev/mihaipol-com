import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkflowRun, WorkflowRunStatus } from "./types/workflow.types";

export async function createWorkflowRun(data: {
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  input_data: Record<string, any>;
  estimated_cost?: number | null;
}): Promise<WorkflowRun> {
  try {
    console.log("[createWorkflowRun] Starting...", {
      workflow_id: data.workflow_id,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      estimated_cost: data.estimated_cost,
      input_data_keys: Object.keys(data.input_data),
    });

    const supabase = getServiceSupabaseClient();
    
    // Safely prepare input_data - ensure it's serializable
    let inputDataToStore: Record<string, any>;
    try {
      // Test if input_data is serializable by doing a round-trip JSON parse
      const testSerialization = JSON.parse(JSON.stringify(data.input_data));
      inputDataToStore = testSerialization;
      console.log("[createWorkflowRun] Input data is serializable");
    } catch (serializeError: any) {
      console.error("[createWorkflowRun] Input data serialization test failed:", serializeError?.message);
      // If serialization fails, try to clean the object
      inputDataToStore = {};
      for (const key in data.input_data) {
        if (Object.prototype.hasOwnProperty.call(data.input_data, key)) {
          const value = data.input_data[key];
          try {
            JSON.parse(JSON.stringify(value));
            inputDataToStore[key] = value;
          } catch (e) {
            console.warn(`[createWorkflowRun] Skipping non-serializable key: ${key}`);
          }
        }
      }
    }
    
    const insertData = {
      workflow_id: data.workflow_id,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      input_data: inputDataToStore,
      status: "pending",
      estimated_cost: data.estimated_cost || null,
    };

    console.log("[createWorkflowRun] Inserting data...");

    const { data: result, error } = await supabase
      .from("workflow_runs")
      .insert(insertData)
      .select(
        `
        *,
        workflows (
          id,
          name,
          icon
        )
      `
      )
      .single();

    if (error) {
      console.error("[createWorkflowRun] Supabase error:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      console.error("[createWorkflowRun] Full error object:", error);
      // Create a clean error object without Zod internals
      const cleanError = new Error(error.message || "Database error");
      (cleanError as any).code = error.code;
      (cleanError as any).details = error.details;
      (cleanError as any).hint = error.hint;
      throw cleanError;
    }

    console.log("[createWorkflowRun] Insert successful, result:", {
      id: result?.id,
      status: result?.status,
    });

    // Normalize workflow
    const normalized = {
      ...result,
      workflow: Array.isArray(result.workflows)
        ? result.workflows.length > 0
          ? result.workflows[0]
          : null
        : result.workflows || null,
    };

    console.log("[createWorkflowRun] Normalized result:", {
      id: normalized.id,
      status: normalized.status,
      hasWorkflow: !!normalized.workflow,
    });

    return normalized as WorkflowRun;
  } catch (error: any) {
    console.error("[createWorkflowRun] Error creating workflow run");
    console.error("[createWorkflowRun] Error type:", error?.constructor?.name);
    console.error("[createWorkflowRun] Error message:", error?.message);
    
    // Create a clean error without any potential Zod internals
    const cleanError = new Error(error?.message || "Failed to create workflow run");
    if (error?.code) (cleanError as any).code = error.code;
    if (error?.details) (cleanError as any).details = error.details;
    if (error?.hint) (cleanError as any).hint = error.hint;
    
    throw cleanError;
  }
}

export async function createWorkflow(data: {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  estimated_cost?: number | null;
  estimated_time_minutes?: number | null;
  input_schema?: Record<string, any> | null;
  enabled?: boolean;
  default_ai_model?: string;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data: result, error } = await supabase
      .from("workflows")
      .insert({
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        estimated_cost: data.estimated_cost ?? null,
        estimated_time_minutes: data.estimated_time_minutes ?? null,
        input_schema: data.input_schema || null,
        enabled: data.enabled ?? true,
        default_ai_model: data.default_ai_model || "anthropic/claude-haiku-4.5",
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating workflow:", error);
    throw error;
  }
}

export async function updateWorkflow(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    console.log("updateWorkflow - id:", id, "updates:", JSON.stringify(updates, null, 2));
    
    const { data, error } = await supabase
      .from("workflows")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error updating workflow:", error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error("Error updating workflow:", error);
    throw error;
  }
}

export async function deleteWorkflow(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("workflows").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting workflow:", error);
    throw error;
  }
}

export async function upsertWorkflowSecrets(
  workflowId: string,
  secrets: {
    webhook_url: string;
    api_key?: string | null;
    config?: Record<string, any> | null;
  }
) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_secrets")
      .upsert(
        {
          workflow_id: workflowId,
          webhook_url: secrets.webhook_url,
          api_key: secrets.api_key || null,
          config: secrets.config || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workflow_id",
        }
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error upserting workflow secrets:", error);
    throw error;
  }
}

/**
 * Update workflow run status and optional output files/metadata
 */
export async function updateWorkflowRunStatus(
  runId: string,
  status: WorkflowRunStatus,
  options?: {
    outputFiles?: Record<string, any> | null;
    executionMetadata?: Record<string, any> | null;
    actualCost?: number | null;
    costBreakdown?: Record<string, any> | null;
  }
): Promise<WorkflowRun> {
  try {
    const supabase = getServiceSupabaseClient();
    const updateData: any = {
      status,
      // Don't include updated_at - let the database trigger handle it, or omit if column doesn't exist
    };

    if (status === "running" && !options?.executionMetadata) {
      // Set started_at if not already set
      updateData.started_at = new Date().toISOString();
    }

    if (status === "completed" || status === "failed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (options?.outputFiles !== undefined) {
      updateData.output_files = options.outputFiles;
    }

    if (options?.executionMetadata !== undefined) {
      updateData.execution_metadata = options.executionMetadata;
    }

    if (options?.actualCost !== undefined) {
      updateData.actual_cost = options.actualCost;
    }

    if (options?.costBreakdown !== undefined) {
      updateData.cost_breakdown = options.costBreakdown;
    }

    const { data, error } = await supabase
      .from("workflow_runs")
      .update(updateData)
      .eq("id", runId)
      .select(
        `
        *,
        workflows (
          id,
          name,
          icon
        )
      `
      )
      .single();

    if (error) throw error;

    // Normalize workflow
    const normalized = {
      ...data,
      workflow: Array.isArray(data.workflows)
        ? data.workflows.length > 0
          ? data.workflows[0]
          : null
        : data.workflows || null,
    };

    return normalized as WorkflowRun;
  } catch (error) {
    console.error("Error updating workflow run status:", error);
    throw error;
  }
}
