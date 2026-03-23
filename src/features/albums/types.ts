export type Platform = {
  id: string;
  name: string;
  icon_media?: { id: string; url: string } | null;
  icon_horizontal_media?: { id: string; url: string } | null;
  icon_media_id?: string | null;
  icon_horizontal_media_id?: string | null;
  default_cta_label: string | null;
};

export type AlbumLink = {
  id: string;
  platform_id: string | null;
  url: string;
  cta_label: string;
  link_type: string | null;
  sort_order: number;
  platforms: Platform | null;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  catalog_number: string | null;
  cover_media?: { id: string; url: string } | null;
  release_date: string | null;
  label_name: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  album_type?: string | null;
  format_type?: string | null;
  description?: string | null;
  drive_folder_id?: string | null;
  drive_folder_url?: string | null;
  audio_files?: Record<string, unknown> | null;
  cover_shape?: 'square' | 'circle';
};
