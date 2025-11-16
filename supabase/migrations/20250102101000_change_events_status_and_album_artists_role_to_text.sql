-- Convert events.event_status and album_artists.role from enums to text with CHECK constraints
-- This avoids enum casting issues while preserving validation and defaults.

BEGIN;

-- ===============================
-- events.event_status: enum -> text
-- ===============================
ALTER TABLE public.events
  ALTER COLUMN event_status DROP DEFAULT;

ALTER TABLE public.events
  ALTER COLUMN event_status TYPE text USING event_status::text;

ALTER TABLE public.events
  ALTER COLUMN event_status SET NOT NULL,
  ALTER COLUMN event_status SET DEFAULT 'upcoming';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_status_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_status_check
      CHECK (event_status IN ('upcoming', 'past', 'cancelled'));
  END IF;
END$$;

-- ===============================
-- album_artists.role: enum -> text
-- ===============================
ALTER TABLE public.album_artists
  ALTER COLUMN role DROP DEFAULT;

ALTER TABLE public.album_artists
  ALTER COLUMN role TYPE text USING role::text;

ALTER TABLE public.album_artists
  ALTER COLUMN role SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'primary';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'album_artists_role_check'
  ) THEN
    ALTER TABLE public.album_artists
      ADD CONSTRAINT album_artists_role_check
      CHECK (role IN ('primary', 'featured', 'remixer'));
  END IF;
END$$;

COMMIT;


