-- Convert updates.publish_status from enum to text with CHECK constraint
-- to align with frontend Select handling and avoid enum casting issues.

BEGIN;

ALTER TABLE public.updates
  ALTER COLUMN publish_status DROP DEFAULT;

ALTER TABLE public.updates
  ALTER COLUMN publish_status TYPE text USING publish_status::text;

ALTER TABLE public.updates
  ALTER COLUMN publish_status SET NOT NULL,
  ALTER COLUMN publish_status SET DEFAULT 'draft';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'updates_publish_status_check'
  ) THEN
    ALTER TABLE public.updates
      ADD CONSTRAINT updates_publish_status_check
      CHECK (publish_status IN ('draft', 'scheduled', 'published', 'archived'));
  END IF;
END$$;

COMMIT;


