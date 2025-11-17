-- Performance optimization indexes
-- These composite indexes optimize common query patterns used in the application

-- Albums: Optimize queries filtering by publish_status and ordering by release_date
-- Used in: getHomepageAlbums, getAllAlbums, getAllAlbumsWithLabels
CREATE INDEX IF NOT EXISTS idx_albums_publish_status_release_date 
ON public.albums(publish_status, release_date DESC NULLS LAST);

-- Albums: Optimize slug lookups with publish_status filter
-- Used in: getAlbumBySlug
CREATE INDEX IF NOT EXISTS idx_albums_slug_publish_status 
ON public.albums(slug, publish_status) 
WHERE publish_status = 'published';

-- Albums: Optimize admin queries ordering by release_date
-- Used in: getAllAlbumsWithLabels (admin)
CREATE INDEX IF NOT EXISTS idx_albums_release_date_desc 
ON public.albums(release_date DESC NULLS LAST);

-- Events: Optimize queries filtering by publish_status and ordering by date
-- Used in: getHomepageEvents, getAllEvents
CREATE INDEX IF NOT EXISTS idx_events_publish_status_date 
ON public.events(publish_status, date ASC);

-- Events: Optimize queries filtering by event_status and date
-- Used in: fetchEvents with status='upcoming' or 'past'
CREATE INDEX IF NOT EXISTS idx_events_status_date 
ON public.events(event_status, date ASC);

-- Events: Optimize slug lookups with publish_status filter
-- Used in: getEventBySlug
CREATE INDEX IF NOT EXISTS idx_events_slug_publish_status 
ON public.events(slug, publish_status) 
WHERE publish_status = 'published';

-- Events: Optimize admin queries ordering by date
-- Used in: getAllEventsUnfiltered (admin)
CREATE INDEX IF NOT EXISTS idx_events_date_desc 
ON public.events(date DESC);

-- Updates: Optimize queries filtering by publish_status and ordering by date
-- Used in: getHomepageUpdates, getAllUpdates
CREATE INDEX IF NOT EXISTS idx_updates_publish_status_date 
ON public.updates(publish_status, date DESC NULLS LAST);

-- Updates: Optimize slug lookups with publish_status filter
-- Used in: getUpdateBySlug
CREATE INDEX IF NOT EXISTS idx_updates_slug_publish_status 
ON public.updates(slug, publish_status) 
WHERE publish_status = 'published';

-- Updates: Optimize admin queries ordering by date
-- Used in: getAllUpdatesUnfiltered (admin)
CREATE INDEX IF NOT EXISTS idx_updates_date_desc 
ON public.updates(date DESC NULLS LAST);

-- Album links: Optimize queries by album_id with sort_order
-- Used in: getAlbumLinks
CREATE INDEX IF NOT EXISTS idx_album_links_album_id_sort_order 
ON public.album_links(album_id, sort_order ASC);

-- Album artists: Optimize queries by album_id with sort_order
-- Used in: getAlbumWithLinksBySlug
CREATE INDEX IF NOT EXISTS idx_album_artists_album_id_sort_order 
ON public.album_artists(album_id, sort_order ASC);

