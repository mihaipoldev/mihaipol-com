export interface PresetFormData {
  name: string;
  description?: string | null;
  icon?: string | null;
  matching_config: {
    image_selection: {
      filter?: {
        content_type?: string | null;
        content_group?: string | null;
      };
    };
    track_grouping: {
      group_by: string | null;
      strategy: "one_video_per_track" | "one_video_per_group" | "all_tracks_one_video";
    };
  };
  video_settings: {
    quality: "720p" | "1080p" | "4k";
    aspect_ratio: "16:9" | "9:16" | "1:1";
    format: "mp4" | "mov" | "webm";
    background_color: "blur" | "black" | "white";
    video_type: "short" | "long";
  };
}

export interface PresetValidationErrors {
  name?: string;
  strategy?: string;
  group_by?: string;
  quality?: string;
  aspect_ratio?: string;
  format?: string;
  background_color?: string;
  video_type?: string;
}

/**
 * Validate preset form data
 */
export function validatePreset(data: Partial<PresetFormData>): PresetValidationErrors | null {
  const errors: PresetValidationErrors = {};

  // Validate name
  if (!data.name || data.name.trim().length === 0) {
    errors.name = "Preset name is required";
  } else if (data.name.length > 100) {
    errors.name = "Name must be 100 characters or less";
  }

  // Validate strategy
  if (!data.matching_config?.track_grouping?.strategy) {
    errors.strategy = "Video creation strategy is required";
  }

  // Validate group_by if strategy requires it
  if (
    data.matching_config?.track_grouping?.strategy === "one_video_per_group" &&
    !data.matching_config?.track_grouping?.group_by
  ) {
    errors.group_by = "Group by field is required for 'one video per group' strategy";
  }

  // Validate video settings
  if (!data.video_settings?.quality) {
    errors.quality = "Quality is required";
  }

  if (!data.video_settings?.aspect_ratio) {
    errors.aspect_ratio = "Aspect ratio is required";
  }

  if (!data.video_settings?.format) {
    errors.format = "Format is required";
  }

  if (!data.video_settings?.background_color) {
    errors.background_color = "Background color is required";
  }

  if (!data.video_settings?.video_type) {
    errors.video_type = "Video type is required";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
