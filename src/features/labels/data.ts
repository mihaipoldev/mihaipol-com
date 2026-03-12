import { getSupabaseBrowser } from "@/lib/supabase-browser";

export async function getAllLabels() {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase
      .from("labels")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all labels:", error);
    return [];
  }
}

export async function getLabelById(id: string) {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.from("labels").select("*").eq("id", id).single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching label by id:", error);
    return null;
  }
}

export async function getLabelBySlug(slug: string) {
  try {
    const supabase = getSupabaseBrowser();
    const { data, error } = await supabase.from("labels").select("*").eq("slug", slug).single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching label by slug:", error);
    return null;
  }
}
