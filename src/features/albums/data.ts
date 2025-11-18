import { supabase } from "@/lib/supabase";

type FetchAlbumsOptions = {
  limit?: number;
  order?: "asc" | "desc";
  includeUnpublished?: boolean;
  includeLabels?: boolean;
};

type AlbumWithLabel = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  release_date: string | null;
  publish_status: string;
  label_id: string | null;
  labelName: string | null;
  labels: { id: string; name: string } | null;
  [key: string]: any;
};

async function fetchAlbums(options: FetchAlbumsOptions = {}): Promise<AlbumWithLabel[]> {
  const { limit, order = "desc", includeUnpublished = false, includeLabels = false } = options;

  try {
    // 🐛 DEBUG: Start timing
    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    // Select only needed columns and use join if labels are needed
    const baseColumns = `id, title, slug, cover_image_url, release_date, publish_status, label_id, catalog_number, album_type`;
    const selectColumns = includeLabels ? `${baseColumns}, labels(id, name)` : baseColumns;

    let query = supabase.from("albums").select(selectColumns);

    // Filter by publish status
    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    // Order by release_date
    query = query.order("release_date", { ascending: order === "asc", nullsFirst: false });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data: albums, error } = await query;

    // 🐛 DEBUG: Log query time
    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    const dataCount = albums?.length || 0;
    console.log(
      `🔍 [DB] albums query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`
    );

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: albums fetch took ${queryTime.toFixed(0)}ms`);
    }

    if (error) throw error;

    // If labels are requested and we used a join, map the label name
    if (includeLabels && albums && albums.length > 0) {
      // Filter out any error objects and ensure we only have valid album objects
      const validAlbums = (albums as any[]).filter(
        (album: any) => album && typeof album === "object" && "id" in album && !("error" in album)
      );

      const albumsWithLabels: AlbumWithLabel[] = validAlbums.map((album: any) => {
        // Normalize labels: Supabase returns array even for one-to-one relationships
        const normalizedLabel = Array.isArray(album.labels)
          ? album.labels.length > 0
            ? album.labels[0]
            : null
          : album.labels || null;

        return {
          ...album,
          labelName: normalizedLabel?.name || null,
          labels: normalizedLabel, // Keep the full label object for compatibility
        };
      });

      return albumsWithLabels;
    }

    // Filter out any error objects for non-label queries too
    if (albums && albums.length > 0) {
      const validAlbums = (albums as any[]).filter(
        (album: any) => album && typeof album === "object" && "id" in album && !("error" in album)
      );

      return validAlbums.map(
        (album: any): AlbumWithLabel => ({
          ...album,
          labelName: null,
          labels: null,
        })
      );
    }

    return [];
  } catch (error) {
    console.error("Error fetching albums:", error);
    return [];
  }
}

// Public data fetching functions
export async function getHomepageAlbums(limit = 6) {
  return fetchAlbums({ limit, order: "desc", includeLabels: true });
}

export async function getAllAlbums() {
  return fetchAlbums({ order: "desc", includeLabels: true });
}

export async function getAlbumBySlug(slug: string) {
  try {
    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("albums")
      .select(
        "id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status, album_type, description"
      )
      .eq("slug", slug)
      .eq("publish_status", "published")
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] album by slug query completed in ${queryTime.toFixed(0)}ms`);

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: album by slug took ${queryTime.toFixed(0)}ms`);
    }

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching album by slug:", error);
    return null;
  }
}

// Admin data fetching functions (returns all albums including unpublished)
export async function getAllAlbumsWithLabels() {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("albums")
      .select(
        `
        id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status,
        labels (
          id,
          name
        )
      `
      )
      .order("release_date", { ascending: false, nullsFirst: false });

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    const dataCount = data?.length || 0;
    console.log(
      `🔍 [DB] all albums with labels query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`
    );

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: all albums with labels took ${queryTime.toFixed(0)}ms`);
    }

    if (error) throw error;

    // Normalize labels: Supabase returns array even for one-to-one relationships
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

export async function getAlbumById(id: string) {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("albums")
      .select(
        `
        id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status, album_type, description,
        labels (
          id,
          name
        )
      `
      )
      .eq("id", id)
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] album by id query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;

    // Normalize labels: Supabase returns array even for one-to-one relationships
    if (data) {
      const normalizedData = {
        ...data,
        labels: Array.isArray(data.labels)
          ? data.labels.length > 0
            ? data.labels[0]
            : null
          : data.labels || null,
      };
      return normalizedData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching album by id:", error);
    return null;
  }
}

export async function getAlbumBySlugAdmin(slug: string) {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("albums")
      .select(
        `
        id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status, album_type, description,
        labels (
          id,
          name
        )
      `
      )
      .eq("slug", slug)
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] album by slug (admin) query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;

    // Normalize labels: Supabase returns array even for one-to-one relationships
    if (data) {
      const normalizedData = {
        ...data,
        labels: Array.isArray(data.labels)
          ? data.labels.length > 0
            ? data.labels[0]
            : null
          : data.labels || null,
      };
      return normalizedData;
    }

    return null;
  } catch (error) {
    console.error("Error fetching album by slug (admin):", error);
    return null;
  }
}

export async function getAlbumLinks(albumId: string) {
  try {
    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("album_links")
      .select(
        `
        id, url, cta_label, sort_order, platform_id, link_type,
        platforms (
          id,
          name,
          icon_url
        )
      `
      )
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true });

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] album links query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;

    // Normalize platforms: Supabase returns array even for one-to-one relationships
    if (data) {
      return data.map((link: any) => ({
        ...link,
        platforms: Array.isArray(link.platforms)
          ? link.platforms.length > 0
            ? link.platforms[0]
            : null
          : link.platforms || null,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching album links:", error);
    return [];
  }
}

export async function getAlbumWithLinksBySlug(slug: string) {
  try {
    // Fetch album
    const album = await getAlbumBySlug(slug);
    if (!album) return null;

    // Fetch all artists for this album via album_artists join table
    let artistName: string | null = null;
    try {
      const { data: albumArtistsData, error: albumArtistsError } = await supabase
        .from("album_artists")
        .select(
          `
          artist_id,
          sort_order,
          artists (
            name
          )
        `
        )
        .eq("album_id", album.id)
        .order("sort_order", { ascending: true });

      if (!albumArtistsError && albumArtistsData && albumArtistsData.length > 0) {
        // Extract artist names and combine them
        const artistNames = albumArtistsData
          .map((aa: any) => aa.artists?.name)
          .filter((name: string | null) => name !== null && name !== undefined);

        if (artistNames.length > 0) {
          artistName = artistNames.join(", ");
        }
      }
    } catch (e) {
      console.log("Error fetching album artists:", e);
    }

    // Fetch album_links with platform information
    let links: any[] = [];
    try {
      const { data: linksData, error: linksError } = await supabase
        .from("album_links")
        .select(
          `
          id,
          url,
          cta_label,
          sort_order,
          platforms (
            name,
            icon_url,
            icon_horizontal_url
          )
        `
        )
        .eq("album_id", album.id)
        .order("sort_order", { ascending: true });

      if (!linksError && linksData) {
        links = linksData.map((link: any) => ({
          id: link.id,
          platformName: link.platforms?.name || "",
          platformIconUrl: link.platforms?.icon_url || null,
          platformIconHorizontalUrl: link.platforms?.icon_horizontal_url || null,
          ctaLabel: link.cta_label || "Play",
          url: link.url || "",
        }));
      }
    } catch (e) {
      console.log("Error fetching album links:", e);
    }

    return {
      album: {
        id: album.id,
        title: album.title,
        slug: album.slug,
        catalog_number: album.catalog_number || null,
        coverImageUrl: album.cover_image_url || null,
        releaseDate: album.release_date || null,
        artistName,
      },
      links,
    };
  } catch (error) {
    console.error("Error fetching album with links by slug:", error);
    return null;
  }
}
