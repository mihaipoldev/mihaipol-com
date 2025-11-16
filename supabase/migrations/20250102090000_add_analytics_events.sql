-- Analytics events table for site-wide tracking
-- Tracks page views, link clicks, and section views
-- Note: Designed to be written by server-only code (service role). RLS disabled.

BEGIN;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('page_view','link_click','section_view')),
  entity_type text NOT NULL CHECK (entity_type IN ('album','album_link','site_section')),
  -- Accept uuid or known string identifiers (e.g., 'albums','updates')
  entity_id text NOT NULL,
  session_id text NULL,
  country text NULL,
  city text NULL,
  user_agent text NULL,
  referrer text NULL,
  metadata jsonb NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity ON public.analytics_events(entity_type, entity_id, event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_country ON public.analytics_events(country);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_entity_type ON public.analytics_events(entity_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_gin_metadata ON public.analytics_events USING GIN (metadata);

-- Disable RLS (server inserts only)
ALTER TABLE public.analytics_events DISABLE ROW LEVEL SECURITY;

COMMIT;


