-- Performance optimizations for Analytics Tab
-- These indexes optimize queries used in the analytics tab for albums

BEGIN;

-- Optimize page views queries by entity
-- Used in: getEntityAnalyticsData() - filters by entity_type, entity_id, event_type='page_view', orders by created_at DESC
-- Query pattern: SELECT * FROM analytics_events WHERE event_type = 'page_view' AND entity_type = X AND entity_id = Y ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_analytics_events_page_view_entity_created_at 
ON public.analytics_events(entity_type, entity_id, created_at DESC)
WHERE event_type = 'page_view';

-- Optimize link clicks queries by entity type and IDs
-- Used in: getEntityAnalyticsData() - filters by entity_type, entity_id IN (...), event_type='link_click', orders by created_at DESC
-- Query pattern: SELECT * FROM analytics_events WHERE event_type = 'link_click' AND entity_type = X AND entity_id IN (...) ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_analytics_events_link_click_entity_type_ids_created_at 
ON public.analytics_events(entity_type, created_at DESC)
WHERE event_type = 'link_click';

-- Optimize geo queries (country-based analytics)
-- Used in: getEntityAnalyticsData() - filters by entity_type, entity_id, country IS NOT NULL, orders by created_at DESC
-- Query pattern: SELECT country FROM analytics_events WHERE entity_type = X AND entity_id = Y AND country IS NOT NULL ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_analytics_events_geo_entity_created_at 
ON public.analytics_events(entity_type, entity_id, created_at DESC)
WHERE country IS NOT NULL;

-- Optimize daily series queries (for charts)
-- Used in: getEntityAnalyticsData() - filters by entity_type, entity_id, event_type IN ('page_view', 'link_click'), created_at >= date, orders by created_at ASC
-- Query pattern: SELECT created_at, event_type FROM analytics_events WHERE entity_type = X AND entity_id = Y AND event_type IN (...) AND created_at >= date ORDER BY created_at ASC
CREATE INDEX IF NOT EXISTS idx_analytics_events_series_entity_created_at 
ON public.analytics_events(entity_type, entity_id, created_at ASC)
WHERE event_type IN ('page_view', 'link_click');

-- Optimize count queries (head queries for totals)
-- Used in: getEntityAnalyticsData() - counts with filters by entity_type, entity_id, event_type
-- Query pattern: SELECT COUNT(*) FROM analytics_events WHERE event_type = X AND entity_type = Y AND entity_id = Z
-- Note: The existing indexes above should help, but this covering index can speed up count queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_count_covering 
ON public.analytics_events(entity_type, entity_id, event_type);

COMMIT;
