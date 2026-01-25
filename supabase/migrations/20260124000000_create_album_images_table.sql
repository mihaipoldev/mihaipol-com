-- Create album_images table for storing multiple content images per album
-- This replaces the single circle_image_url column with a flexible multi-image system

CREATE TABLE IF NOT EXISTS album_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  title TEXT,  -- e.g., "Vinyl 1 Side A"
  image_url TEXT NOT NULL,
  crop_shape TEXT NOT NULL CHECK (crop_shape IN ('circle', 'square')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fetching images by album
CREATE INDEX IF NOT EXISTS idx_album_images_album_id_sort ON album_images(album_id, sort_order);

-- RLS policies
ALTER TABLE album_images ENABLE ROW LEVEL SECURITY;

-- Public read for published albums
CREATE POLICY "Public can view images for published albums"
  ON album_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Admin full access
CREATE POLICY "Admins can manage all album images"
  ON album_images FOR ALL
  USING (auth.role() = 'authenticated');

-- Migrate existing circle_image_url to album_images
INSERT INTO album_images (album_id, title, image_url, crop_shape, sort_order)
SELECT id, 'Circle Image', circle_image_url, 'circle', 0
FROM albums
WHERE circle_image_url IS NOT NULL AND circle_image_url != '';

-- Remove circle_image_url column
ALTER TABLE albums DROP COLUMN IF EXISTS circle_image_url;

COMMENT ON TABLE album_images IS 'Stores multiple content images per album with configurable shapes (circle or square)';
COMMENT ON COLUMN album_images.crop_shape IS 'Shape of the cropped image: circle or square';
COMMENT ON COLUMN album_images.sort_order IS 'Order for displaying multiple images';
