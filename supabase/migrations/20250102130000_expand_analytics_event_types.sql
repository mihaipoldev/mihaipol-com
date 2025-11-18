-- Expand analytics events to support events, updates, and session tracking
-- Adds new event types and entity types to the analytics_events table

BEGIN;

-- Drop existing CHECK constraints
ALTER TABLE public.analytics_events 
  DROP CONSTRAINT IF EXISTS analytics_events_event_type_check;

ALTER TABLE public.analytics_events 
  DROP CONSTRAINT IF EXISTS analytics_events_entity_type_check;

-- Add updated CHECK constraints with new types
ALTER TABLE public.analytics_events 
  ADD CONSTRAINT analytics_events_event_type_check 
  CHECK (event_type IN ('page_view','link_click','section_view','session_start'));

ALTER TABLE public.analytics_events 
  ADD CONSTRAINT analytics_events_entity_type_check 
  CHECK (entity_type IN ('album','album_link','site_section','event','event_link','update','update_link'));

COMMIT;

