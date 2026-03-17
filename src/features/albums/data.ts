import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getSitePreferenceNumber } from "@/features/settings/data";

type FetchAlbumsOptions = {
  limit?: number;
  order?: "asc" | "desc";
  includeUnpublished?: boolean;
  labelName?: string;
};

type AlbumWithLabel = {
  id: string;
  title: string;
  slug: string;
  cover_image_url: string | null;
  release_date: string | null;
  publish_status: string;
  label_name: string | null;
  labelName: string | null;
  [key: string]: unknown;
};

async function fetchAlbums(options: FetchAlbumsOptions = {}): Promise<AlbumWithLabel[]> {
  const {
    limit,
    order = "desc",
    includeUnpublished = false,
    labelName,
  } = options;

  try {
    const supabaseClient = await getSupabaseServer();

    const selectColumns = `id, title, slug, cover_image_url, release_date, publish_status, label_name, catalog_number, album_type, format_type, cover_shape`;

    let query = supabaseClient.from("albums").select(selectColumns).is("deleted_at", null);

    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    if (labelName) {
      query = query.eq("label_name", labelName);
    }

    query = query.order("release_date", { ascending: order === "asc", nullsFirst: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data: albums, error } = await query;

    if (error) {
      console.error("Error in albums query:", error);
      throw error;
    }

    if (albums && albums.length > 0) {
      const validAlbums = (albums as unknown as AlbumWithLabel[]).filter(
        (album) => album && typeof album === "object" && "id" in album && !("error" in album)
      );

      return validAlbums.map(
        (album): AlbumWithLabel => ({
          ...album,
          labelName: album.label_name || null,
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
  return fetchAlbums({ limit: actualLimit, order: "desc" });
}

export async function getHomepageGriffithAlbums(limit?: number) {
  const defaultLimit = await getSitePreferenceNumber("griffith_albums_homepage_limit", 6);
  const actualLimit = limit ?? defaultLimit;
  return fetchAlbums({
    limit: actualLimit,
    order: "desc",
    labelName: "Griffith Records",
  });
}

export async function getLatestAlbumByLabelName(labelName: string) {
  try {
    const supabaseClient = await getSupabaseServer();

    const { data, error } = await supabaseClient
      .from("albums")
      .select(
        `id, title, slug, cover_image_url, release_date, publish_status, label_name, catalog_number, album_type, format_type, description, cover_shape`
      )
      .is("deleted_at", null)
      .eq("label_name", labelName)
      .eq("publish_status", "published")
      .order("release_date", { ascending: false, nullsFirst: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      labelName: data.label_name || null,
    } as AlbumWithLabel;
  } catch (error) {
    console.error("Error fetching latest album by label name:", error);
    return null;
  }
}

export async function getAllAlbums(labelName?: string) {
  return fetchAlbums({ order: "desc", labelName });
}

export async function getAlbumBySlug(slug: string) {
  try {
    // Use server client for proper RLS handling in server components
    const supabaseClient = await getSupabaseServer();

    const { data, error } = await supabaseClient
      .from("albums")
      .select(
        "id, title, slug, catalog_number, cover_image_url, release_date, label_name, publish_status, album_type, format_type, description, cover_shape"
      )
      .is("deleted_at", null)
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
        "id, title, slug, catalog_number, cover_image_url, release_date, label_name, publish_status, album_type, format_type, description, cover_shape"
      )
      .is("deleted_at", null)
      .eq("id", id)
      .eq("publish_status", "published")
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      labelName: data.label_name || null,
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
      .is("deleted_at", null)
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

export async function getAlbumWithLinksBySlug(slug: string) {
  try {
    const supabaseClient = await getSupabaseServer();

    // Fetch album
    const album = await getAlbumBySlug(slug);
    if (!album) return null;

    // Parse artist name from title format: "Artist - Title"
    const artistName = album.title.includes(" - ")
      ? album.title.split(" - ")[0].trim()
      : null;

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
        .is("deleted_at", null)
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

