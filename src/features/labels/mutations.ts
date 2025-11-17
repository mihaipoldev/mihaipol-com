import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function createLabel(labelData: {
  name: string;
  slug: string;
  description?: string | null;
  website_url?: string | null;
  logo_image_url?: string | null;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("labels").insert(labelData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating label:", error);
    throw error;
  }
}

export async function updateLabel(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("labels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating label:", error);
    throw error;
  }
}

export async function deleteLabel(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("labels").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting label:", error);
    throw error;
  }
}
