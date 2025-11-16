-- Change albums.publish_status from enum to text while preserving allowed values
-- and default. This avoids enum casting issues from the app while keeping validation.

BEGIN;

-- Drop default to allow type change
ALTER TABLE public.albums
  ALTER COLUMN publish_status DROP DEFAULT;

-- Change type from enum public.publish_status to text
ALTER TABLE public.albums
  ALTER COLUMN publish_status TYPE text USING publish_status::text;

-- Reapply NOT NULL and default
ALTER TABLE public.albums
  ALTER COLUMN publish_status SET NOT NULL,
  ALTER COLUMN publish_status SET DEFAULT 'draft';

-- Ensure only allowed values are stored
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'albums_publish_status_check'
  ) THEN
    ALTER TABLE public.albums
      ADD CONSTRAINT albums_publish_status_check
      CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived'));
  END IF;
END$$;

COMMIT;


