export type LandingEvent = {
  id: string;
  slug: string;
  title: string;
  city?: string | null;
  country?: string | null;
  venue?: string | null;
  date: string;
  tickets_url?: string | null;
  ticket_label?: string | null;
};

export type LandingAlbum = {
  id: string;
  slug: string;
  title: string;
  cover_image_url?: string | null;
  cover_media?: { id: string; url: string }[] | null;
  labelName?: string | null;
  release_date?: string | null;
  catalog_number?: string | null;
  album_type?: string | null;
  format_type?: string | null;
  description?: string | null;
  cover_shape?: 'square' | 'circle';
};

export type LandingUpdate = {
  id: string;
  slug: string;
  title: string;
  date?: string | null;
  description?: string | null;
  image_url?: string | null;
  image_media?: { id: string; url: string }[] | null;
  tags?: string[] | null;
  is_featured?: boolean | null;
  show_cover_image?: boolean | null;
  embeds?: Array<{
    type: "youtube" | "spotify" | "bandcamp" | "soundcloud" | "instagram";
    url?: string;
    embed_code?: string;
  }> | null;
  external_links?: Array<{
    label: string;
    url: string;
  }> | null;
};
