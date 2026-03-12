import { getSupabaseServer } from "@/lib/supabase-ssr";

export type HeroCarouselImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * Get all active hero carousel images ordered by sort_order
 */
export async function getHeroCarouselImages(): Promise<HeroCarouselImage[]> {
  try {
    const supabaseClient = await getSupabaseServer();

    const { data, error } = await supabaseClient
      .from("hero_carousel_images")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching hero carousel images:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching hero carousel images:", error);
    return [];
  }
}


