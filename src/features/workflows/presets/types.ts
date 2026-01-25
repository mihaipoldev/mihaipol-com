export interface WorkflowPreset {
  id: string;
  workflow_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  matching_config: MatchingConfig;
  video_settings: VideoSettings;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchingConfig {
  image_selection: {
    filter?: {
      content_type?: string;
      content_group?: string;
    };
  };
  track_grouping: {
    group_by: string | null; // Field name to group by (e.g., "content_group") or null
    strategy: "one_video_per_track" | "one_video_per_group" | "all_tracks_one_video";
  };
}

export interface VideoSettings {
  quality: "720p" | "1080p" | "4k";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  format: "mp4" | "mov" | "webm";
  background_color: "black" | "white" | "blur";
  video_type: "short" | "long";
}

export interface PresetMatchResult {
  preset: WorkflowPreset;
  matched_videos: Array<{
    image_id: string;
    image_name: string;
    track_ids: string[];
    track_names: string[];
    group?: string;
  }>;
  total_videos: number;
}
