-- Performance optimizations for Album Links Tab
-- These indexes optimize batch operations used in the links tab

BEGIN;

-- Optimize batch delete operations for album_links
-- Used in: batchUpdateAlbumLinks() when deleting removed links
-- Query pattern: DELETE FROM album_links WHERE album_id = X AND id IN (...)
CREATE INDEX IF NOT EXISTS idx_album_links_album_id_id 
ON public.album_links(album_id, id);

COMMIT;
