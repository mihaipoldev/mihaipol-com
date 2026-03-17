import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getSitePreferenceNumber } from "@/features/settings/data";

type FetchUpdatesOptions = {
  limit?: number;
  order?: "asc" | "desc";
  includeUnpublished?: boolean;
};

async function fetchUpdates(options: FetchUpdatesOptions = {}) {
  const { limit, order = "desc", includeUnpublished = false } = options;

  try {
    const supabase = await getSupabaseServer();
    // Select only needed columns
    let query = supabase
      .from("updates")
      .select("id, title, slug, date, publish_status, image_url, description, tags, is_featured, show_cover_image, embeds, external_links")
      .is("deleted_at", null);

    // Filter by publish status (matches index column order)
    // Uses: idx_updates_publish_status_date (DESC) for order="desc"
    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    // Order by date (matches index ordering - DESC NULLS LAST)
    query = query.order("date", { ascending: order === "asc", nullsFirst: false });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching updates:", error);
    return [];
  }
}

export async function getHomepageUpdates(limit?: number) {
  const defaultLimit = await getSitePreferenceNumber("updates_homepage_limit", 3);
  const actualLimit = limit ?? defaultLimit;
  return fetchUpdates({ limit: actualLimit, order: "desc" });
}

export async function getAllUpdates() {
  return fetchUpdates({ order: "desc" });
}

export async function getUpdateBySlug(slug: string) {
  try {
    const supabase = await getSupabaseServer();
    // Query optimized for: idx_updates_slug_publish_status (partial index on published)
    const { data, error } = await supabase
      .from("updates")
      .select("id, title, slug, date, publish_status, image_url, description, read_more_url, tags, is_featured, show_cover_image, embeds, external_links")
      .is("deleted_at", null)
      .eq("slug", slug)
      .eq("publish_status", "published")
      .single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching update by slug:", error);
    return null;
  }
}

