import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { getPresetById } from "./data";
import type { WorkflowPreset, PresetMatchResult, MatchingConfig } from "./types";

type AlbumImage = {
  id: string;
  album_id: string;
  title: string | null;
  image_url: string;
  content_type: string | null;
  content_group: string | null;
  sort_order: number;
};

type AlbumAudio = {
  id: string;
  album_id: string;
  title: string | null;
  audio_url: string;
  content_group: string | null;
  sort_order: number;
};

/**
 * Apply a preset to an album and generate matched video configurations
 */
export async function applyPreset(
  presetId: string,
  albumId: string
): Promise<PresetMatchResult> {
  // 1. Get preset
  const preset = await getPresetById(presetId);

  if (!preset) {
    throw new Error(`Preset not found: ${presetId}`);
  }

  if (!preset.enabled) {
    throw new Error(`Preset is disabled: ${presetId}`);
  }

  // 2. Get album's images and tracks
  const supabase = getServiceSupabaseClient();

  const { data: imagesData, error: imagesError } = await supabase
    .from("album_images")
    .select("id, album_id, title, image_url, content_type, content_group, sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });

  if (imagesError) {
    throw new Error(`Failed to fetch images: ${imagesError.message}`);
  }

  const { data: tracksData, error: tracksError } = await supabase
    .from("album_audios")
    .select("id, album_id, title, audio_url, content_group, sort_order")
    .eq("album_id", albumId)
    .order("sort_order", { ascending: true });

  if (tracksError) {
    throw new Error(`Failed to fetch tracks: ${tracksError.message}`);
  }

  let images: AlbumImage[] = (imagesData || []) as AlbumImage[];
  let tracks: AlbumAudio[] = (tracksData || []) as AlbumAudio[];

  // 3. Filter images based on preset's image_selection
  if (preset.matching_config.image_selection?.filter) {
    const filter = preset.matching_config.image_selection.filter;

    if (filter.content_type) {
      images = images.filter((img) => img.content_type === filter.content_type);
    }

    if (filter.content_group) {
      images = images.filter((img) => img.content_group === filter.content_group);
    }
  }

  if (images.length === 0) {
    throw new Error("No images match the preset's filters");
  }

  if (tracks.length === 0) {
    throw new Error("No tracks found for this album");
  }

  // 4. Match images to tracks based on strategy
  const matchedVideos = matchImagesAndTracks(
    images,
    tracks,
    preset.matching_config.track_grouping
  );

  return {
    preset,
    matched_videos: matchedVideos,
    total_videos: matchedVideos.length,
  };
}

/**
 * Match images and tracks based on grouping strategy
 */
function matchImagesAndTracks(
  images: AlbumImage[],
  tracks: AlbumAudio[],
  trackGrouping: MatchingConfig["track_grouping"]
): PresetMatchResult["matched_videos"] {
  const { group_by, strategy } = trackGrouping;

  if (strategy === "all_tracks_one_video") {
    // All tracks in one video with first image
    return [
      {
        image_id: images[0].id,
        image_name: images[0].title || `Image ${images[0].sort_order + 1}`,
        track_ids: tracks.map((t) => t.id),
        track_names: tracks.map((t) => t.title || `Track ${t.sort_order + 1}`),
        group: "all",
      },
    ];
  }

  if (strategy === "one_video_per_track") {
    // Each track gets its own video
    if (group_by) {
      // Match tracks to images by group
      return matchByGroup(images, tracks, group_by, "one_per_track");
    } else {
      // Use first image for all tracks
      return tracks.map((track) => ({
        image_id: images[0].id,
        image_name: images[0].title || `Image ${images[0].sort_order + 1}`,
        track_ids: [track.id],
        track_names: [track.title || `Track ${track.sort_order + 1}`],
      }));
    }
  }

  if (strategy === "one_video_per_group") {
    // One video per group (all tracks in that group combined)
    if (!group_by) {
      throw new Error("one_video_per_group strategy requires group_by field");
    }
    return matchByGroup(images, tracks, group_by, "one_per_group");
  }

  throw new Error(`Unknown strategy: ${strategy}`);
}

/**
 * Match by content_group field
 */
function matchByGroup(
  images: AlbumImage[],
  tracks: AlbumAudio[],
  groupField: string,
  mode: "one_per_track" | "one_per_group"
): PresetMatchResult["matched_videos"] {
  // Get unique groups from both images and tracks
  const imageGroups = new Map<string, AlbumImage[]>();
  const trackGroups = new Map<string, AlbumAudio[]>();

  images.forEach((img) => {
    const group = (img as any)[groupField] || "ungrouped";
    if (!imageGroups.has(group)) {
      imageGroups.set(group, []);
    }
    imageGroups.get(group)!.push(img);
  });

  tracks.forEach((track) => {
    const group = (track as any)[groupField] || "ungrouped";
    if (!trackGroups.has(group)) {
      trackGroups.set(group, []);
    }
    trackGroups.get(group)!.push(track);
  });

  const result: PresetMatchResult["matched_videos"] = [];

  // For each group, match images to tracks
  for (const [group, groupTracks] of trackGroups.entries()) {
    const groupImages = imageGroups.get(group);

    if (!groupImages || groupImages.length === 0) {
      console.warn(`No images found for group: ${group}, skipping`);
      continue;
    }

    // Use first image from this group
    const image = groupImages[0];

    if (mode === "one_per_group") {
      // All tracks in this group → one video
      result.push({
        image_id: image.id,
        image_name: image.title || `Image ${image.sort_order + 1}`,
        track_ids: groupTracks.map((t) => t.id),
        track_names: groupTracks.map((t) => t.title || `Track ${t.sort_order + 1}`),
        group,
      });
    } else {
      // Each track in this group → separate video
      groupTracks.forEach((track) => {
        result.push({
          image_id: image.id,
          image_name: image.title || `Image ${image.sort_order + 1}`,
          track_ids: [track.id],
          track_names: [track.title || `Track ${track.sort_order + 1}`],
          group,
        });
      });
    }
  }

  return result;
}

/**
 * Convert preset match result to workflow input_data
 */
export function presetMatchToInputData(matchResult: PresetMatchResult): Record<string, any> {
  return {
    videos: matchResult.matched_videos.map((video) => ({
      image_id: video.image_id,
      track_ids: video.track_ids,
      video_type: matchResult.preset.video_settings.video_type,
    })),
    quality: matchResult.preset.video_settings.quality,
    aspect_ratio: matchResult.preset.video_settings.aspect_ratio,
    format: matchResult.preset.video_settings.format,
    background_color: matchResult.preset.video_settings.background_color,
  };
}
