import "server-only";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

/**
 * Admin-only: fetch all albums with labels (including unpublished).
 * Isolated in this file to avoid pulling in heavy deps (client supabase, settings, etc.)
 * that can cause Turbopack to hang when compiling /admin/albums.
 */
export async function getAllAlbumsWithLabels() {
  try {
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from("albums")
      .select(
        `
        id, title, slug, catalog_number, album_type, format_type, description, cover_image_url, release_date, label_id, publish_status, cover_shape,
        labels (
          id,
          name
        )
      `
      )
      .order("release_date", { ascending: false, nullsFirst: false });

    if (error) throw error;

    if (data) {
      return data.map((album: any) => ({
        ...album,
        labels: Array.isArray(album.labels)
          ? album.labels.length > 0
            ? album.labels[0]
            : null
          : album.labels || null,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching all albums:", error);
    return [];
  }
}
