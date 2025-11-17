import { supabase } from "@/lib/supabase";

export async function getAllArtists() {
  try {
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all artists:", error);
    return [];
  }
}

export async function getArtistById(id: string) {
  try {
    const { data, error } = await supabase.from("artists").select("*").eq("id", id).single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching artist by id:", error);
    return null;
  }
}

export async function getArtistBySlug(slug: string) {
  try {
    const { data, error } = await supabase.from("artists").select("*").eq("slug", slug).single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching artist by slug:", error);
    return null;
  }
}
