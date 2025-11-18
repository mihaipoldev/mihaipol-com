export type Label = {
  id: string;
  name: string;
};

export type Platform = {
  id: string;
  name: string;
  icon_url: string | null;
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
  cover_image_url: string | null;
  release_date: string | null;
  label_id: string | null;
  publish_status: "draft" | "scheduled" | "published" | "archived";
  labels: Label | null;
  album_type?: string | null;
  description?: string | null;
};
