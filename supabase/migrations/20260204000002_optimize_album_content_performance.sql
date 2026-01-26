-- Performance optimizations for Album Content Tab
-- These indexes optimize batch operations used in the content tab

BEGIN;

-- Optimize batch delete operations for album_images
-- Used in: batchUpdateAlbumImages() when deleting removed images
-- Query pattern: DELETE FROM album_images WHERE album_id = X AND id IN (...)
CREATE INDEX IF NOT EXISTS idx_album_images_album_id_id 
ON public.album_images(album_id, id);

-- Optimize batch delete operations for album_audios
-- Used in: batchUpdateAlbumAudios() when deleting removed audios
-- Query pattern: DELETE FROM album_audios WHERE album_id = X AND id IN (...)
CREATE INDEX IF NOT EXISTS idx_album_audios_album_id_id 
ON public.album_audios(album_id, id);

COMMIT;
