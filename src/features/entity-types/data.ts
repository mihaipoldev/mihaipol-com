import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { EntityType } from "./types";
import type { Workflow } from "@/features/workflows/types";

/**
 * Get all enabled entity types, ordered by name
 */
export async function getAllEntityTypes(): Promise<EntityType[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("entity_types")
      .select("*")
      .eq("enabled", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as EntityType[];
  } catch (error) {
    console.error("Error fetching entity types:", error);
    return [];
  }
}

/**
 * Get all entity types including disabled ones (for admin)
 */
export async function getAllEntityTypesIncludingDisabled(): Promise<EntityType[]> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("entity_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return (data || []) as EntityType[];
  } catch (error) {
    console.error("Error fetching all entity types:", error);
    return [];
  }
}

/**
 * Get a single entity type by ID
 */
export async function getEntityTypeById(id: string): Promise<EntityType | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("entity_types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as EntityType;
  } catch (error) {
    console.error("Error fetching entity type by id:", error);
    return null;
  }
}

/**
 * Get a single entity type by slug
 */
export async function getEntityTypeBySlug(slug: string): Promise<EntityType | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("entity_types")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }
    return data as EntityType;
  } catch (error) {
    console.error("Error fetching entity type by slug:", error);
    return null;
  }
}

/**
 * Get workflows for a specific entity type using the junction table
 * Optimized: Uses cached entity type lookup and efficient query
 */
export async function getWorkflowsByEntityType(entityTypeSlug: string): Promise<Workflow[]> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const supabase = getServiceSupabaseClient();

    // Optimized: First get entity_type_id (can be cached), then fetch workflows
    // The index on entity_types.slug makes this very fast
    const { data: entityType, error: entityTypeError } = await supabase
      .from("entity_types")
      .select("id")
      .eq("slug", entityTypeSlug)
      .single();

    if (entityTypeError || !entityType) {
      return [];
    }

    const typedEntityType = entityType as { id: string };
    
    // Fetch workflows with JOIN to workflows table (single query)
    const { data, error } = await supabase
      .from("entity_type_workflows")
      .select(`
        display_order,
        workflows!inner (
          id,
          slug,
          name,
          description,
          icon,
          estimated_cost,
          estimated_time_minutes,
          input_schema,
          enabled,
          default_ai_model,
          created_at,
          updated_at
        )
      `)
      .eq("entity_type_id", typedEntityType.id)
      .eq("workflows.enabled", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Extract workflows from the nested structure and filter enabled ones
    const workflows = (data || [])
      .filter((item: any) => item.workflows !== null && item.workflows.enabled === true)
      .map((item: any) => item.workflows);

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    // Performance monitoring
    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY: getWorkflowsByEntityType took ${totalTime.toFixed(0)}ms (${workflows.length} workflows)`
      );
    } else if (totalTime > 100) {
      console.log(
        `[DB] getWorkflowsByEntityType: ${totalTime.toFixed(2)}ms (${workflows.length} workflows)`
      );
    }

    return workflows as Workflow[];
  } catch (error) {
    console.error("Error fetching workflows by entity type:", error);
    return getWorkflowsByEntityTypeFallback(entityTypeSlug);
  }
}

/**
 * Fallback method using sequential queries (original implementation)
 * Used if the optimized JOIN query fails
 */
async function getWorkflowsByEntityTypeFallback(entityTypeSlug: string): Promise<Workflow[]> {
  const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
  
  try {
    const supabase = getServiceSupabaseClient();

    // First, get the entity_type_id by slug
    const { data: entityType } = await supabase
      .from("entity_types")
      .select("id")
      .eq("slug", entityTypeSlug)
      .single();

    if (!entityType) {
      return [];
    }

    const typedEntityType = entityType as { id: string };
    const { data, error } = await supabase
      .from("entity_type_workflows")
      .select(`
        display_order,
        workflows (
          id,
          slug,
          name,
          description,
          icon,
          estimated_cost,
          estimated_time_minutes,
          input_schema,
          enabled,
          default_ai_model,
          created_at,
          updated_at
        )
      `)
      .eq("entity_type_id", typedEntityType.id)
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Extract workflows from the nested structure and filter enabled ones
    const workflows = (data || [])
      .filter((item: any) => item.workflows !== null && item.workflows.enabled === true)
      .map((item: any) => item.workflows);

    const totalTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - startTime;

    if (totalTime > 500) {
      console.warn(
        `⚠️ [DB] SLOW QUERY (fallback): getWorkflowsByEntityType took ${totalTime.toFixed(0)}ms`
      );
    }

    return workflows as Workflow[];
  } catch (error) {
    console.error("Error fetching workflows by entity type (fallback):", error);
    return [];
  }
}

/**
 * Get workflows for a specific entity type by ID (for admin)
 */
export async function getWorkflowsByEntityTypeId(entityTypeId: string): Promise<Workflow[]> {
  try {
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from("entity_type_workflows")
      .select(`
        display_order,
        workflows (
          id,
          slug,
          name,
          description,
          icon,
          estimated_cost,
          estimated_time_minutes,
          input_schema,
          enabled,
          default_ai_model,
          created_at,
          updated_at
        )
      `)
      .eq("entity_type_id", entityTypeId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    // Extract workflows from the nested structure
    const workflows = (data || [])
      .filter((item: any) => item.workflows !== null)
      .map((item: any) => ({
        ...item.workflows,
        display_order: item.display_order,
      }));

    return workflows as Workflow[];
  } catch (error) {
    console.error("Error fetching workflows by entity type id:", error);
    return [];
  }
}
