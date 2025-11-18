-- Additional analytics performance indexes for dashboard queries
-- These indexes optimize the dashboard website visits and section clicks queries

BEGIN;

-- Optimize session_start queries for dashboard website visits
-- Used for: dashboard website visits (session_start events)
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_start_created_at 
ON public.analytics_events(event_type, created_at ASC)
WHERE event_type = 'session_start';

-- Optimize section_view queries for dashboard
-- Used for: dashboard section clicks (section_view events)
CREATE INDEX IF NOT EXISTS idx_analytics_events_section_view_created_at 
ON public.analytics_events(event_type, entity_type, entity_id, created_at ASC)
WHERE event_type = 'section_view' AND entity_type = 'site_section';

COMMIT;

