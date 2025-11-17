-- Check if performance indexes exist
-- Run this in your Supabase SQL editor to verify indexes are applied

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexname LIKE 'idx_albums_%' 
        OR indexname LIKE 'idx_events_%'
        OR indexname LIKE 'idx_updates_%'
        OR indexname LIKE 'idx_album_links_%'
        OR indexname LIKE 'idx_album_artists_%'
    )
ORDER BY tablename, indexname;

-- Expected indexes:
-- idx_albums_publish_status_release_date
-- idx_albums_slug_publish_status
-- idx_albums_release_date_desc
-- idx_events_publish_status_date
-- idx_events_status_date
-- idx_events_slug_publish_status
-- idx_events_date_desc
-- idx_updates_publish_status_date
-- idx_updates_slug_publish_status
-- idx_updates_date_desc
-- idx_album_links_album_id_sort_order
-- idx_album_artists_album_id_sort_order

