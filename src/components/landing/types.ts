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
  labelName?: string | null;
  release_date?: string | null;
  catalog_number?: string | null;
  album_type?: string | null;
};

export type LandingUpdate = {
  id: string;
  slug: string;
  title: string;
  date?: string | null;
  description?: string | null;
  image_url?: string | null;
};
