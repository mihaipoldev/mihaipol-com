-- Add content organization fields to album_images and album_audios tables
-- This enables flexible organization beyond just "sides" - supporting vinyl releases, 
-- digital releases, booklets, bonus content, etc.

BEGIN;

-- Add content_type and content_group to album_images
ALTER TABLE album_images 
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS content_group TEXT;

-- Add content_group to album_audios
ALTER TABLE album_audios 
ADD COLUMN IF NOT EXISTS content_group TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_album_images_content_type ON album_images(content_type);
CREATE INDEX IF NOT EXISTS idx_album_images_content_group ON album_images(content_group);
CREATE INDEX IF NOT EXISTS idx_album_audios_content_group ON album_audios(content_group);

COMMENT ON COLUMN album_images.content_type IS 'Type of content: vinyl_circle, vinyl_cover, album_cover, booklet, poster, digital_cover, banner, other';
COMMENT ON COLUMN album_images.content_group IS 'Grouping identifier: side_a, side_b, main, bonus, deluxe, or custom';
COMMENT ON COLUMN album_audios.content_group IS 'Grouping identifier: side_a, side_b, main, bonus, deluxe, or custom';

COMMIT;
