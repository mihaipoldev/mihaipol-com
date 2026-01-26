-- Add privacy controls to album_audios and album_images tables
-- Adds is_public column (default false/private) and updates RLS policies

BEGIN;

-- Add is_public column to album_audios
ALTER TABLE album_audios 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_album_audios_is_public 
ON album_audios(is_public);

-- Add is_public column to album_images
ALTER TABLE album_images 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_album_images_is_public 
ON album_images(is_public);

-- Drop existing public read policy for album_audios
DROP POLICY IF EXISTS "Public can view audios for published albums" ON album_audios;

-- Create new policy for public audios (everyone can see if is_public = true)
CREATE POLICY "Public can view public audios for published albums"
  ON album_audios FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_audios.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Create policy for authenticated users to view private audios
CREATE POLICY "Authenticated users can view private audios for published albums"
  ON album_audios FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_public = false
    AND EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_audios.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Drop existing public read policy for album_images
DROP POLICY IF EXISTS "Public can view images for published albums" ON album_images;

-- Create new policy for public images (everyone can see if is_public = true)
CREATE POLICY "Public can view public images for published albums"
  ON album_images FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Create policy for authenticated users to view private images
CREATE POLICY "Authenticated users can view private images for published albums"
  ON album_images FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_public = false
    AND EXISTS (
      SELECT 1 FROM albums 
      WHERE albums.id = album_images.album_id 
      AND albums.publish_status = 'published'
    )
  );

-- Admin policies remain unchanged (they can see all)

COMMENT ON COLUMN album_audios.is_public IS 'Whether this audio file is publicly visible. Defaults to false (private).';
COMMENT ON COLUMN album_images.is_public IS 'Whether this image is publicly visible. Defaults to false (private).';

COMMIT;
