import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getLabelBySlug } from "@/features/labels/data";
import { getSitePreferenceNumber } from "@/features/settings/data";

type FetchAlbumsOptions = {
  limit?: number;
  order?: "asc" | "desc";
  includeUnpublished?: boolean;
  includeLabels?: boolean;
  labelId?: string;
  labelSlug?: string;
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
  [key: string]: unknown;
};

async function fetchAlbums(options: FetchAlbumsOptions = {}): Promise<AlbumWithLabel[]> {
  const {
    limit,
    order = "desc",
    includeUnpublished = false,
    includeLabels = false,
    labelId,
    labelSlug,
  } = options;

  try {
    // Use server client for proper RLS handling in server components
    const supabaseClient = await getSupabaseServer();

    // If filtering by slug, first get the label ID
    let actualLabelId = labelId;
    if (labelSlug && !labelId) {
      const label = await getLabelBySlug(labelSlug);
      if (label) {
        actualLabelId = label.id;
      } else {
        // If label not found, return empty array
        return [];
      }
    }

    // Select only needed columns and use join if labels are needed
    const baseColumns = `id, title, slug, cover_image_url, release_date, publish_status, label_id, catalog_number, album_type, format_type, cover_shape`;
    const selectColumns = includeLabels ? `${baseColumns}, labels(id, name, slug)` : baseColumns;

    let query = supabaseClient.from("albums").select(selectColumns);

    // Filter by publish status first (matches index column order)
    // Uses: idx_albums_publish_status_release_date (DESC) or idx_albums_publish_status_release_date_asc (ASC)
    // If labelId is provided, uses: idx_albums_label_id_publish_status_release_date
    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    // Filter by label ID if provided (must come after publish_status for composite index)
    if (actualLabelId) {
      query = query.eq("label_id", actualLabelId);
    }

    // Order by release_date (matches index ordering)
    query = query.order("release_date", { ascending: order === "asc", nullsFirst: false });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data: albums, error } = await query;

    if (error) {
      console.error("Error in albums query:", error);
      throw error;
    }

    // If labels are requested and we used a join, map the label name
    if (includeLabels && albums && albums.length > 0) {
      // Filter out any error objects and ensure we only have valid album objects
      const validAlbums = (albums as unknown as AlbumWithLabel[]).filter(
        (album) => album && typeof album === "object" && "id" in album && !("error" in album)
      );

      const albumsWithLabels: AlbumWithLabel[] = validAlbums.map((album) => {
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
      const validAlbums = (albums as unknown as AlbumWithLabel[]).filter(
        (album) => album && typeof album === "object" && "id" in album && !("error" in album)
      );

      return validAlbums.map(
        (album): AlbumWithLabel => ({
          ...album,
          labelName: null,
          labels: null,
        })
      );
    }

    return [];
  } catch (error: unknown) {
    console.error("Error fetching albums:", error);
    return [];
  }
}

// Public data fetching functions
export async function getHomepageAlbums(limit?: number) {
  const defaultLimit = await getSitePreferenceNumber("albums_homepage_limit", 6);
  const actualLimit = limit ?? defaultLimit;
  return fetchAlbums({ limit: actualLimit, order: "desc", includeLabels: true });
}

// Griffith label ID constant
const GRIFFITH_LABEL_ID = "689e375f-e5eb-492c-8942-cc4723c9bc91";

export async function getHomepageGriffithAlbums(limit?: number) {
  const defaultLimit = await getSitePreferenceNumber("griffith_albums_homepage_limit", 6);
  const actualLimit = limit ?? defaultLimit;
  return fetchAlbums({
    limit: actualLimit,
    order: "desc",
    includeLabels: true,
    labelId: GRIFFITH_LABEL_ID,
  });
}

export async function getLatestAlbumByLabelId(labelId: string) {
  try {
    // Use server client for proper RLS handling in server components
    const supabaseClient = await getSupabaseServer();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    // Query structure optimized for: idx_albums_label_id_publish_status_release_date
    // Filter order: label_id -> publish_status -> order by release_date DESC
    const { data, error } = await supabaseClient
      .from("albums")
      .select(
        `id, title, slug, cover_image_url, release_date, publish_status, label_id, catalog_number, album_type, format_type, description, cover_shape, labels(id, name)`
      )
      .eq("label_id", labelId)
      .eq("publish_status", "published")
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;

    if (error) {
      // If no album found, return null instead of throwing
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    // Normalize labels: Supabase returns array even for one-to-one relationships
    const normalizedLabel = Array.isArray(data.labels)
      ? data.labels.length > 0
        ? data.labels[0]
        : null
      : data.labels || null;

    return {
      ...data,
      labelName: normalizedLabel?.name || null,
      labels: normalizedLabel,
    } as AlbumWithLabel;
  } catch (error) {
    console.error("Error fetching latest album by label ID:", error);
    return null;
  }
}

export async function getAllAlbums(labelId?: string, labelSlug?: string) {
  return fetchAlbums({ order: "desc", includeLabels: true, labelId, labelSlug });
}

export async function getAlbumBySlug(slug: string) {
  try {
    // Use server client for proper RLS handling in server components
    const supabaseClient = await getSupabaseServer();

    // Query optimized for: idx_albums_slug_publish_status (partial index on published)
    const { data, error } = await supabaseClient
      .from("albums")
      .select(
        "id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status, album_type, format_type, description, cover_shape"
      )
      .eq("slug", slug)
      .eq("publish_status", "published")
      .single();

    if (error) {
      console.error("Error fetching album by slug:", error);
      throw error;
    }
    return data || null;
  } catch (error) {
    console.error("Error fetching album by slug:", error);
    return null;
  }
}

export async function getPublishedAlbumById(id: string) {
  try {
    const supabaseClient = await getSupabaseServer();

    const { data, error } = await supabaseClient
      .from("albums")
      .select(
        "id, title, slug, catalog_number, cover_image_url, release_date, label_id, publish_status, album_type, format_type, description, cover_shape, labels(id, name)"
      )
      .eq("id", id)
      .eq("publish_status", "published")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    if (!data) return null;

    const normalizedLabel = Array.isArray(data.labels)
      ? data.labels.length > 0 ? data.labels[0] : null
      : data.labels || null;

    return {
      ...data,
      labelName: normalizedLabel?.name || null,
      labels: normalizedLabel,
    } as AlbumWithLabel;
  } catch (error) {
    console.error("Error fetching published album by id:", error);
    return null;
  }
}

export async function getAlbumLinks(albumId: string) {
  try {
    const supabase = await getSupabaseServer();
    // Query optimized for: idx_album_links_album_id_sort_order
    const { data, error } = await supabase
      .from("album_links")
      .select(
        `
        id, url, cta_label, sort_order, platform_id, link_type,
        platforms (
          id,
          name,
          icon_url,
          icon_horizontal_url
        )
      `
      )
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // Normalize platforms: Supabase returns array even for one-to-one relationships
    if (data) {
      return data.map((link) => ({
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

export async function getAlbumArtists(albumId: string) {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    // Query optimized for: idx_album_artists_album_id_sort_order
    const { data, error } = await supabase
      .from("album_artists")
      .select(
        `
        id, artist_id, role, sort_order,
        artists (
          id,
          name,
          profile_image_url
        )
      `
      )
      .eq("album_id", albumId)
      .order("sort_order", { ascending: true });

    if (error) throw error;

    // Normalize artists: Supabase returns array even for one-to-one relationships
    if (data) {
      return data.map((aa) => ({
        ...aa,
        artist: Array.isArray(aa.artists)
          ? aa.artists.length > 0
            ? aa.artists[0]
            : null
          : aa.artists || null,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error fetching album artists:", error);
    return [];
  }
}

export async function getAlbumWithLinksBySlug(slug: string) {
  try {
    // Use server client for proper RLS handling in server components
    const supabaseClient = await getSupabaseServer();

    // Fetch album
    const album = await getAlbumBySlug(slug);
    if (!album) return null;

    // Fetch all artists for this album via album_artists join table
    // Query optimized for: idx_album_artists_album_id_sort_order
    let artistName: string | null = null;
    try {
      const { data: albumArtistsData, error: albumArtistsError } = await supabaseClient
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
          .map((aa) => (aa.artists as { name?: string } | null)?.name)
          .filter((name): name is string => name !== null && name !== undefined);

        if (artistNames.length > 0) {
          artistName = artistNames.join(", ");
        }
      }
    } catch (e) {
      // ignore — album still renders without artist name
    }

    // Fetch album_links with platform information
    // Query optimized for: idx_album_links_album_id_sort_order
    type NormalizedLink = {
      id: string;
      platformName: string;
      platformIconUrl: string | null;
      platformIconHorizontalUrl: string | null;
      ctaLabel: string;
      url: string;
    };
    let links: NormalizedLink[] = [];
    try {
      const { data: linksData, error: linksError } = await supabaseClient
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
        links = linksData.map((link) => {
          const platform = Array.isArray(link.platforms)
            ? link.platforms[0] ?? null
            : link.platforms ?? null;
          return {
            id: link.id,
            platformName: (platform as { name?: string } | null)?.name || "",
            platformIconUrl: (platform as { icon_url?: string | null } | null)?.icon_url ?? null,
            platformIconHorizontalUrl: (platform as { icon_horizontal_url?: string | null } | null)?.icon_horizontal_url ?? null,
            ctaLabel: link.cta_label || "Play",
            url: link.url || "",
          };
        });
      }
    } catch (e) {
      // ignore — album still renders without links
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

