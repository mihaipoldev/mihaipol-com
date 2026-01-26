import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { Workflow, WorkflowSecrets } from "./types";
import { getWorkflowsByEntityType } from "@/features/entity-types/data";
import type { WorkflowRun } from "./types/workflow.types";

/**
 * Get all enabled workflows, ordered by created_at descending
 */
export async function getAllWorkflows(): Promise<Workflow[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("enabled", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Workflow[];
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return [];
  }
}

/**
 * Get all workflows including disabled ones (for admin)
 */
export async function getAllWorkflowsIncludingDisabled(): Promise<Workflow[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Workflow[];
  } catch (error) {
    console.error("Error fetching all workflows:", error);
    return [];
  }
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflowById(id: string): Promise<Workflow | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as Workflow;
  } catch (error) {
    console.error("Error fetching workflow by id:", error);
    return null;
  }
}

/**
 * Get a single workflow by slug
 */
export async function getWorkflowBySlug(slug: string): Promise<Workflow | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as Workflow;
  } catch (error) {
    console.error("Error fetching workflow by slug:", error);
    return null;
  }
}

/**
 * Get workflow secrets (if exists)
 */
export async function getWorkflowSecrets(workflowId: string): Promise<WorkflowSecrets | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_secrets")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as WorkflowSecrets;
  } catch (error) {
    console.error("Error fetching workflow secrets:", error);
    return null;
  }
}

/**
 * Get workflows for a specific entity type by slug
 */
export async function getWorkflowsByEntityTypeSlug(entityTypeSlug: string): Promise<Workflow[]> {
  return getWorkflowsByEntityType(entityTypeSlug);
}

/**
 * Get workflow runs for a specific entity
 */
export async function getWorkflowRunsByEntity(
  entityType: string,
  entityId: string,
  limit: number = 10
): Promise<WorkflowRun[]> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_runs")
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
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Normalize workflows: Supabase returns array even for one-to-one relationships
    const runs = (data || []).map((run: any) => ({
      ...run,
      workflow: Array.isArray(run.workflows)
        ? run.workflows.length > 0
          ? run.workflows[0]
          : null
        : run.workflows || null,
    })) as WorkflowRun[];

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    // Performance monitoring
    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY: getWorkflowRunsByEntity took ${totalTime.toFixed(0)}ms (${runs.length} runs)`
      );
    } else if (totalTime > 100) {
      console.log(
        `[DB] getWorkflowRunsByEntity: ${totalTime.toFixed(2)}ms (${runs.length} runs)`
      );
    }

    return runs;
  } catch (error) {
    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;
    console.error(
      `Error fetching workflow runs (took ${totalTime.toFixed(2)}ms):`,
      error
    );
    return [];
  }
}

/**
 * Get a single workflow run by ID
 */
export async function getWorkflowRunById(runId: string): Promise<WorkflowRun | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_runs")
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
      .eq("id", runId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

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
    console.error("Error fetching workflow run by id:", error);
    return null;
  }
}
