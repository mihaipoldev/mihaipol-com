import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { WorkflowPreset } from "./types";

/**
 * Get all enabled presets for a specific workflow
 */
export async function getWorkflowPresets(workflowId: string): Promise<WorkflowPreset[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_presets")
      .select("*")
      .eq("workflow_id", workflowId)
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as WorkflowPreset[];
  } catch (error) {
    console.error("Error fetching workflow presets:", error);
    return [];
  }
}

/**
 * Get all presets for workflows available to an entity type
 * Optimized: Uses parallel queries instead of sequential queries
 */
export async function getPresetsForEntity(entityType: string): Promise<WorkflowPreset[]> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const supabase = getServiceSupabaseClient();

    // Optimized: Get entity type first, then fetch workflows and presets in parallel
    // This reduces from 3 sequential queries to 1 + 2 parallel
    const { data: entityTypeRecord, error: entityTypeError } = await supabase
      .from("entity_types")
      .select("id")
      .eq("slug", entityType)
      .single();

    if (entityTypeError || !entityTypeRecord) {
      return [];
    }

    // Now fetch workflows and presets in parallel (after we have entity_type_id)
    const [workflowsResult, presetsResult] = await Promise.all([
      // Get workflows for this entity type
      supabase
        .from("entity_type_workflows")
        .select(`
          workflow_id,
          workflows!inner (
            id,
            enabled
          )
        `)
        .eq("entity_type_id", entityTypeRecord.id),
      // Pre-fetch all presets (we'll filter by workflow_ids after)
      supabase
        .from("workflow_presets")
        .select("*")
        .eq("enabled", true)
        .order("name", { ascending: true }),
    ]);

    const { data: entityTypeWorkflows, error: workflowsError } = workflowsResult;
    const { data: allPresets, error: presetsError } = presetsResult;

    if (workflowsError) {
      console.error("Error fetching entity type workflows:", workflowsError);
      return getPresetsForEntityFallback(entityType);
    }

    if (presetsError) {
      console.error("Error fetching presets:", presetsError);
      return [];
    }

    // Extract workflow IDs (only enabled workflows)
    const workflowIds = new Set(
      (entityTypeWorkflows || [])
        .map((etw: any) => {
          const workflow = Array.isArray(etw.workflows) ? etw.workflows[0] : etw.workflows;
          return workflow?.enabled ? workflow.id : null;
        })
        .filter((id: string | null): id is string => id !== null)
    );

    if (workflowIds.size === 0) {
      return [];
    }

    // Filter presets to only those for enabled workflows (already fetched in parallel)
    const presets = (allPresets || []).filter((preset: any) =>
      workflowIds.has(preset.workflow_id)
    );

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    // Performance monitoring
    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY: getPresetsForEntity took ${totalTime.toFixed(0)}ms (${presets.length} presets)`
      );
    } else if (totalTime > 100) {
      console.log(
        `[DB] getPresetsForEntity: ${totalTime.toFixed(2)}ms (${presets.length} presets)`
      );
    }

    return presets as WorkflowPreset[];
  } catch (error) {
    console.error("Error fetching presets for entity:", error);
    return getPresetsForEntityFallback(entityType);
  }
}

/**
 * Fallback method using sequential queries (original implementation)
 * Used if the optimized JOIN query fails
 */
async function getPresetsForEntityFallback(entityType: string): Promise<WorkflowPreset[]> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const supabase = getServiceSupabaseClient();

    // Get entity type by slug
    const { data: entityTypeRecord, error: entityTypeError } = await supabase
      .from("entity_types")
      .select("id")
      .eq("slug", entityType)
      .single();

    if (entityTypeError || !entityTypeRecord) {
      return [];
    }

    // Get workflows for this entity type via junction table
    const { data: entityTypeWorkflows, error: workflowsError } = await supabase
      .from("entity_type_workflows")
      .select(`
        workflow_id,
        workflows!inner (
          id,
          enabled
        )
      `)
      .eq("entity_type_id", entityTypeRecord.id);

    if (workflowsError) {
      console.error("Error fetching entity type workflows:", workflowsError);
      return [];
    }

    // Extract workflow IDs (only enabled workflows)
    const workflowIds = (entityTypeWorkflows || [])
      .map((etw: any) => {
        const workflow = Array.isArray(etw.workflows) ? etw.workflows[0] : etw.workflows;
        return workflow?.enabled ? workflow.id : null;
      })
      .filter((id: string | null): id is string => id !== null);

    if (workflowIds.length === 0) {
      return [];
    }

    // Get all presets for these workflows
    const { data: presets, error: presetsError } = await supabase
      .from("workflow_presets")
      .select("*")
      .in("workflow_id", workflowIds)
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (presetsError) {
      console.error("Error fetching presets:", presetsError);
      return [];
    }

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY (fallback): getPresetsForEntity took ${totalTime.toFixed(0)}ms`
      );
    }

    return (presets || []) as WorkflowPreset[];
  } catch (error) {
    console.error("Error fetching presets for entity (fallback):", error);
    return [];
  }
}

/**
 * Get a single preset by ID
 */
export async function getPresetById(presetId: string): Promise<WorkflowPreset | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("workflow_presets")
      .select("*")
      .eq("id", presetId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as WorkflowPreset;
  } catch (error) {
    console.error("Error fetching preset by id:", error);
    return null;
  }
}
