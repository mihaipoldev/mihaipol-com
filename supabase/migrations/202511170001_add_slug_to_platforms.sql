-- Add slug column to platforms and backfill existing records
ALTER TABLE public.platforms
ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.platforms
SET slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

ALTER TABLE public.platforms
ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS platforms_slug_key ON public.platforms(slug);

