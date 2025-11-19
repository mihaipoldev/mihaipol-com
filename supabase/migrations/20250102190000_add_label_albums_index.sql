-- Add composite indexes for album query optimizations
-- These indexes optimize queries that filter by label_id and order by release_date

BEGIN;

-- Index for label_id + publish_status + release_date DESC
-- Used in: getLatestAlbumByLabelId
CREATE INDEX IF NOT EXISTS idx_albums_label_id_publish_status_release_date 
ON public.albums(label_id, publish_status, release_date DESC NULLS LAST)
WHERE publish_status = 'published';

-- Index for publish_status + release_date ASC (for ascending order queries)
-- Used in: fetchAlbums when order="asc"
CREATE INDEX IF NOT EXISTS idx_albums_publish_status_release_date_asc 
ON public.albums(publish_status, release_date ASC NULLS LAST)
WHERE publish_status = 'published';

COMMIT;

