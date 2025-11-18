-- Analytics performance optimization indexes
-- These composite indexes optimize the analytics dashboard queries
-- Used in: getAnalyticsData

BEGIN;

-- Optimize queries filtering by event_type and created_at (for date-filtered queries)
-- Used for: album page views, link clicks, geo data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at 
ON public.analytics_events(event_type, created_at DESC);

-- Optimize queries filtering by event_type, entity_type, and created_at
-- Used for: album page views (event_type='page_view', entity_type='album')
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_entity_created_at 
ON public.analytics_events(event_type, entity_type, created_at DESC);

-- Optimize queries filtering by created_at with country (for geo queries)
-- Used for: country statistics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at_country 
ON public.analytics_events(created_at DESC, country)
WHERE country IS NOT NULL;

-- Optimize queries filtering by event_type and created_at for daily series
-- Used for: daily visits and clicks series (last 30 days)
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at_asc 
ON public.analytics_events(event_type, created_at ASC)
WHERE event_type IN ('page_view', 'link_click');

COMMIT;

