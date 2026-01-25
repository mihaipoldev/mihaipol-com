-- Rename YouTube Video workflow to Static Video Renderer
-- This migration updates the workflow slug, name, and description to better reflect
-- that this workflow renders static videos for any platform, not just YouTube.

-- Update workflow slug and metadata
UPDATE workflows 
SET 
  slug = 'static-video-renderer',
  name = 'Static Video Renderer',
  description = 'Render videos by combining static images with audio tracks. Supports multiple aspect ratios, qualities, and background options.'
WHERE slug = 'youtube-video';

-- Update workflow_secrets references if they exist
UPDATE workflow_secrets 
SET workflow_id = (SELECT id FROM workflows WHERE slug = 'static-video-renderer')
WHERE workflow_id = (SELECT id FROM workflows WHERE slug = 'youtube-video');
