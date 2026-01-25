export const CONTENT_TYPE_OPTIONS = [
  { label: "Vinyl Circle", value: "vinyl_circle" },
  { label: "Vinyl Cover", value: "vinyl_cover" },
  { label: "Album Cover", value: "album_cover" },
  { label: "Booklet", value: "booklet" },
  { label: "Poster", value: "poster" },
  { label: "Digital Cover", value: "digital_cover" },
  { label: "Banner", value: "banner" },
  { label: "Other", value: "other" },
];

export const GROUP_BY_OPTIONS = [
  { label: "Content Group", value: "content_group" },
  { label: "Don't Group", value: "none" },
];

export const STRATEGY_OPTIONS = [
  {
    label: "One video per track",
    value: "one_video_per_track",
    description: "Each track gets its own video",
  },
  {
    label: "One video per group",
    value: "one_video_per_group",
    description: "All tracks in a group combined into one video",
  },
  {
    label: "All tracks in one video",
    value: "all_tracks_one_video",
    description: "Single video with all tracks",
  },
];

export const QUALITY_OPTIONS = [
  { label: "720p (HD)", value: "720p" },
  { label: "1080p (Full HD)", value: "1080p" },
  { label: "4K (Ultra HD)", value: "4k" },
];

export const FORMAT_OPTIONS = [
  { label: "MP4", value: "mp4" },
  { label: "MOV", value: "mov" },
  { label: "WebM", value: "webm" },
];

export const ASPECT_RATIO_OPTIONS = [
  { label: "16:9 (Landscape)", value: "16:9" },
  { label: "9:16 (Portrait)", value: "9:16" },
  { label: "1:1 (Square)", value: "1:1" },
];

export const BACKGROUND_COLOR_OPTIONS = [
  { label: "Blur", value: "blur" },
  { label: "Black", value: "black" },
  { label: "White", value: "white" },
];

export const VIDEO_TYPE_OPTIONS = [
  { label: "Long (full track)", value: "long" },
  { label: "Short (highlight only)", value: "short" },
];
