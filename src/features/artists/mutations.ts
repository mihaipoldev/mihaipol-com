import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function createArtist(artistData: {
  name: string;
  slug: string;
  bio?: string | null;
  profile_image_url?: string | null;
  city?: string | null;
  country?: string | null;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("artists").insert(artistData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating artist:", error);
    throw error;
  }
}

export async function updateArtist(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("artists")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating artist:", error);
    throw error;
  }
}

export async function deleteArtist(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("artists").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting artist:", error);
    throw error;
  }
}
