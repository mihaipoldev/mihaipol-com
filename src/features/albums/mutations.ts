import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function createAlbum(albumData: {
  title: string;
  slug: string;
  catalog_number?: string | null;
  album_type?: string | null;
  format_type?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  release_date?: string | null;
  label_id?: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("albums").insert(albumData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating album:", error);
    throw error;
  }
}

export async function updateAlbum(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("albums")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating album:", error);
    throw error;
  }
}

export async function deleteAlbum(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("albums").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting album:", error);
    throw error;
  }
}

export async function createAlbumLink(linkData: {
  album_id: string;
  platform_id?: string | null;
  url: string;
  cta_label: string;
  link_type?: string | null;
  sort_order?: number;
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("album_links").insert(linkData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating album link:", error);
    throw error;
  }
}

export async function updateAlbumLink(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("album_links")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating album link:", error);
    throw error;
  }
}

export async function deleteAlbumLink(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("album_links").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting album link:", error);
    throw error;
  }
}

export async function batchUpdateAlbumLinks(
  albumId: string,
  links: Array<{
    id?: string; // If id exists, update; if not, create new
    platform_id?: string | null;
    url: string;
    cta_label: string;
    link_type?: string | null;
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing links for this album
    const { data: existingLinks, error: fetchError } = await supabase
      .from("album_links")
      .select("id")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingLinkIds = new Set(existingLinks?.map((link) => link.id) || []);
    const newLinkIds = new Set(links.filter((link) => link.id).map((link) => link.id!));

    // Find links to delete (exist in DB but not in new list)
    const linksToDelete = existingLinkIds
      ? Array.from(existingLinkIds).filter((id) => !newLinkIds.has(id))
      : [];

    // Delete removed links
    if (linksToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("album_links")
        .delete()
        .in("id", linksToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each link: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const link of links) {
      if (link.id && existingLinkIds.has(link.id)) {
        // Update existing link
        updates.push(
          Promise.resolve(
            supabase
              .from("album_links")
              .update({
                platform_id: link.platform_id || null,
                url: link.url,
                cta_label: link.cta_label,
                link_type: link.link_type || null,
                sort_order: link.sort_order,
              })
              .eq("id", link.id)
          ).then(({ error }) => {
            if (error) throw error;
            return true;
          })
        );
      } else {
        // Create new link
        creates.push({
          album_id: albumId,
          platform_id: link.platform_id || null,
          url: link.url,
          cta_label: link.cta_label,
          link_type: link.link_type || null,
          sort_order: link.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Create new links
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_links").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album links:", error);
    throw error;
  }
}

export async function batchUpdateAlbumArtists(
  albumId: string,
  artists: Array<{
    id?: string; // If id exists, update; if not, create new
    artist_id: string;
    role: "primary" | "featured" | "remixer";
    sort_order: number;
  }>
) {
  try {
    const supabase = getServiceSupabaseClient();

    // Get existing album_artists for this album
    const { data: existingArtists, error: fetchError } = await supabase
      .from("album_artists")
      .select("id")
      .eq("album_id", albumId);

    if (fetchError) throw fetchError;

    const existingArtistIds = new Set(existingArtists?.map((aa) => aa.id) || []);
    const newArtistIds = new Set(artists.filter((aa) => aa.id).map((aa) => aa.id!));

    // Find album_artists to delete (exist in DB but not in new list)
    const artistsToDelete = existingArtistIds
      ? Array.from(existingArtistIds).filter((id) => !newArtistIds.has(id))
      : [];

    // Delete removed album_artists
    if (artistsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("album_artists")
        .delete()
        .in("id", artistsToDelete);

      if (deleteError) throw deleteError;
    }

    // Process each album_artist: update existing or create new
    const updates: Promise<any>[] = [];
    const creates: any[] = [];

    for (const artist of artists) {
      if (artist.id && existingArtistIds.has(artist.id)) {
        // Update existing album_artist
        updates.push(
          Promise.resolve(
            supabase
              .from("album_artists")
              .update({
                artist_id: artist.artist_id,
                role: artist.role,
                sort_order: artist.sort_order,
              })
              .eq("id", artist.id)
          ).then(({ error }) => {
            if (error) throw error;
            return true;
          })
        );
      } else {
        // Create new album_artist
        creates.push({
          album_id: albumId,
          artist_id: artist.artist_id,
          role: artist.role,
          sort_order: artist.sort_order,
        });
      }
    }

    // Execute all updates
    if (updates.length > 0) {
      await Promise.all(updates);
    }

    // Create new album_artists
    if (creates.length > 0) {
      const { error: createError } = await supabase.from("album_artists").insert(creates);

      if (createError) throw createError;
    }

    return true;
  } catch (error) {
    console.error("Error batch updating album artists:", error);
    throw error;
  }
}
