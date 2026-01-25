-- Seed default workflow presets for static-video-renderer workflow
-- These presets provide common use cases for video generation

BEGIN;

-- YouTube - Vinyl Circles: Long videos with vinyl circle artwork
INSERT INTO public.workflow_presets (workflow_id, name, description, icon, matching_config, video_settings) 
SELECT 
  id,
  'YouTube - Vinyl Circles',
  'Create YouTube videos using vinyl circle artwork with full tracks',
  '📹',
  '{
    "image_selection": {
      "filter": {
        "content_type": "vinyl_circle"
      }
    },
    "track_grouping": {
      "group_by": "content_group",
      "strategy": "one_video_per_track"
    }
  }'::jsonb,
  '{
    "quality": "1080p",
    "aspect_ratio": "16:9",
    "format": "mp4",
    "background_color": "blur",
    "video_type": "long"
  }'::jsonb
FROM public.workflows
WHERE slug = 'static-video-renderer'
LIMIT 1;

-- Instagram Stories: Short vertical videos using album covers
INSERT INTO public.workflow_presets (workflow_id, name, description, icon, matching_config, video_settings)
SELECT 
  id,
  'Instagram Stories',
  'Short vertical videos using album covers for Instagram Stories',
  '📱',
  '{
    "image_selection": {
      "filter": {
        "content_type": "album_cover"
      }
    },
    "track_grouping": {
      "group_by": null,
      "strategy": "one_video_per_track"
    }
  }'::jsonb,
  '{
    "quality": "1080p",
    "aspect_ratio": "9:16",
    "format": "mp4",
    "background_color": "black",
    "video_type": "short"
  }'::jsonb
FROM public.workflows
WHERE slug = 'static-video-renderer'
LIMIT 1;

-- TikTok - All Tracks: Short vertical videos for TikTok
INSERT INTO public.workflow_presets (workflow_id, name, description, icon, matching_config, video_settings)
SELECT 
  id,
  'TikTok - All Tracks',
  'Short vertical videos using album covers for TikTok',
  '🎵',
  '{
    "image_selection": {
      "filter": {
        "content_type": "album_cover"
      }
    },
    "track_grouping": {
      "group_by": null,
      "strategy": "one_video_per_track"
    }
  }'::jsonb,
  '{
    "quality": "1080p",
    "aspect_ratio": "9:16",
    "format": "mp4",
    "background_color": "blur",
    "video_type": "short"
  }'::jsonb
FROM public.workflows
WHERE slug = 'static-video-renderer'
LIMIT 1;

COMMIT;
