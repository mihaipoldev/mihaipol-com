export type Label = {
  id: string;
  name: string;
  logo_image_url?: string | null;
};

export type Platform = {
  id: string;
  name: string;
  icon_url: string | null;
  icon_horizontal_url?: string | null;
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

export type AlbumImage = {
  id: string;
  album_id: string;
  title: string | null;
  image_url: string;
  crop_shape: 'circle' | 'square';
  content_type?: string | null;
  content_group?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

export type AlbumAudio = {
  id: string;
  album_id: string;
  title: string | null;
  audio_url: string;
  duration: number | null;
  file_size: number | null;
  highlight_start_time: number | null;
  waveform_peaks?: number[] | null; // Pre-computed waveform peaks for fast visualization
  content_group?: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
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
  format_type?: string | null;
  description?: string | null;
  drive_folder_id?: string | null;
  drive_folder_url?: string | null;
  audio_files?: Record<string, unknown> | null;
  cover_shape?: 'square' | 'circle';
  album_images?: AlbumImage[];
  album_audios?: AlbumAudio[];
};
