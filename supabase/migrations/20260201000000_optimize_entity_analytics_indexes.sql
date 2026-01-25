-- Optimize analytics queries for entity-specific analytics (album/event/update pages)
-- These indexes optimize getEntityAnalyticsData queries which filter by entity_id
-- Used in: AlbumAnalyticsTab, EventAnalyticsTab, UpdateAnalyticsTab

BEGIN;

-- Index for page views queries filtered by entity
-- Query pattern: event_type='page_view', entity_type=X, entity_id=Y, created_at>=Z
-- Used in: getEntityAnalyticsData page views query (line 436-444)
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_view_entity_created_at 
ON public.analytics_events(event_type, entity_type, entity_id, created_at DESC)
WHERE event_type = 'page_view';

-- Index for link clicks queries filtered by entity
-- Query pattern: event_type='link_click', entity_type=X, entity_id IN (...), created_at>=Z
-- Used in: getEntityAnalyticsData link clicks query (line 446-456)
CREATE INDEX IF NOT EXISTS idx_analytics_events_link_click_entity_created_at 
ON public.analytics_events(event_type, entity_type, entity_id, created_at DESC)
WHERE event_type = 'link_click';

-- Index for geo data queries filtered by entity with country
-- Query pattern: entity_type=X, entity_id=Y, country IS NOT NULL, created_at>=Z
-- Used in: getEntityAnalyticsData geo query (line 458-466)
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity_created_at_country 
ON public.analytics_events(entity_type, entity_id, created_at DESC, country)
WHERE country IS NOT NULL;

-- Index for daily series queries filtered by entity
-- Query pattern: entity_type=X, entity_id=Y, event_type IN ('page_view','link_click'), created_at>=Z ORDER BY created_at ASC
-- Used in: getEntityAnalyticsData daily series queries (line 469-503)
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity_event_created_at_asc 
ON public.analytics_events(entity_type, entity_id, event_type, created_at ASC)
WHERE event_type IN ('page_view', 'link_click');

-- Index for count queries (head requests) filtered by entity
-- Query pattern: event_type=X, entity_type=Y, entity_id=Z (no date filter for counts)
-- Used in: getEntityAnalyticsData count queries (line 404-419)
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_entity_entity_id 
ON public.analytics_events(event_type, entity_type, entity_id);

COMMIT;
