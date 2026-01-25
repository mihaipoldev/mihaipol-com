import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function createEntityType(data: {
  slug: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  enabled?: boolean;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data: result, error } = await supabase
      .from("entity_types")
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return result;
  } catch (error) {
    console.error("Error creating entity type:", error);
    throw error;
  }
}

export async function updateEntityType(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("entity_types")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating entity type:", error);
    throw error;
  }
}

export async function deleteEntityType(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("entity_types").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting entity type:", error);
    throw error;
  }
}

export async function updateEntityTypeWorkflows(
  entityTypeId: string,
  workflows: Array<{
    workflow_id: string;
    display_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing workflow associations for this entity type
    const { data: existingWorkflows, error: fetchError } = await supabase
      .from("entity_type_workflows")
      .select("id")
      .eq("entity_type_id", entityTypeId);

    if (fetchError) throw fetchError;

    const existingWorkflowIds = new Set(existingWorkflows?.map((w) => w.id) || []);
    const newWorkflowIds = new Set(
      workflows.map((w) => w.workflow_id)
    );

    // Find associations to delete (exist in DB but not in new list)
    const workflowsToDelete = existingWorkflows?.filter(
      (w: any) => {
        // We need to check by workflow_id, not id
        const workflowAssociation = existingWorkflows.find((ew: any) => ew.id === w.id);
        // This is a bit tricky - we need to get the workflow_id from the junction table
        return false; // We'll handle this differently
      }
    ) || [];

    // Better approach: delete all existing and recreate
    // This ensures proper ordering
    const { error: deleteError } = await supabase
      .from("entity_type_workflows")
      .delete()
      .eq("entity_type_id", entityTypeId);

    if (deleteError) throw deleteError;

    // Insert new associations
    if (workflows.length > 0) {
      const associationsToInsert = workflows.map((w) => ({
        entity_type_id: entityTypeId,
        workflow_id: w.workflow_id,
        display_order: w.display_order,
      }));

      const { error: insertError } = await supabase
        .from("entity_type_workflows")
        .insert(associationsToInsert);

      if (insertError) throw insertError;
    }

    return true;
  } catch (error) {
    console.error("Error updating entity type workflows:", error);
    throw error;
  }
}
