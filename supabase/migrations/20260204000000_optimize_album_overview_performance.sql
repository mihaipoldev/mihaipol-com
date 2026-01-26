-- Performance optimizations for Album Overview Tab
-- These indexes optimize queries used in the album overview page

BEGIN;

-- 1. Optimize album_links query with platform info (covering index)
-- Used in: getAlbumLinks() and getEntityAnalyticsData()
-- Query pattern: SELECT id, album_id, platform_id FROM album_links WHERE album_id = X ORDER BY sort_order
CREATE INDEX IF NOT EXISTS idx_album_links_album_platform_covering 
ON public.album_links(album_id, sort_order) 
INCLUDE (id, platform_id);

-- 2. Optimize analytics queries for link clicks with IN clause
-- Used in: getEntityAnalyticsData() when querying clicks for multiple album_link IDs
-- Query pattern: event_type='link_click', entity_type='album_link', entity_id IN (...), created_at>=Z
-- This is more specific than the existing index for IN queries with multiple link_ids
CREATE INDEX IF NOT EXISTS idx_analytics_events_link_click_album_link_ids_created_at 
ON public.analytics_events(entity_type, entity_id, created_at DESC)
WHERE event_type = 'link_click' AND entity_type = 'album_link';

-- 3. Composite index for platforms lookup by IDs (if not exists)
-- Used when fetching platforms by their IDs after getting album_links
-- Query pattern: SELECT id, name, icon_url FROM platforms WHERE id IN (...)
CREATE INDEX IF NOT EXISTS idx_platforms_id_covering 
ON public.platforms(id) 
INCLUDE (name, icon_url);

COMMIT;
