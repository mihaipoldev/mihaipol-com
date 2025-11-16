-- Migration: Refactor events table and remove tracks table
-- This migration does everything in one go:
-- 1. Adds a `date` column to events (type: date)
-- 2. Migrates data from `starts_at` to `date` (extracting just the date part)
-- 3. Makes date column NOT NULL
-- 4. Drops `starts_at` and `ends_at` columns
-- 5. Updates indexes (drops old, creates new)
-- 6. Drops the `tracks` table

BEGIN;

-- ========================================
-- 1) Add date column to events
-- ========================================

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date date;

-- ========================================
-- 2) Migrate data from starts_at to date
-- ========================================

UPDATE public.events 
SET date = starts_at::date
WHERE starts_at IS NOT NULL AND date IS NULL;

-- ========================================
-- 3) Make date column NOT NULL (after migration)
-- ========================================

-- Set default for any NULL values (shouldn't happen, but safety first)
UPDATE public.events 
SET date = CURRENT_DATE
WHERE date IS NULL;

ALTER TABLE public.events ALTER COLUMN date SET NOT NULL;

-- ========================================
-- 4) Drop old columns
-- ========================================

ALTER TABLE public.events DROP COLUMN IF EXISTS starts_at;
ALTER TABLE public.events DROP COLUMN IF EXISTS ends_at;

-- ========================================
-- 5) Update indexes
-- ========================================

-- Drop old index
DROP INDEX IF EXISTS public.idx_events_starts_at;

-- Create new index on date (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);

-- ========================================
-- 6) Drop tracks table
-- ========================================

DROP TABLE IF EXISTS public.tracks CASCADE;

COMMIT;

