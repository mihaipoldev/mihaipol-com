-- Follow-up migration: refactor news_posts to updates and remove artist_links
-- This migration assumes the initial schema migration has already been applied

-- ========================================
-- 1) Remove artist_links table
-- ========================================

DROP TABLE IF EXISTS public.artist_links CASCADE;

-- ========================================
-- 2) Rename news_posts to updates
-- ========================================

ALTER TABLE public.news_posts RENAME TO updates;

-- ========================================
-- 3) Rename columns in updates table
-- ========================================

ALTER TABLE public.updates RENAME COLUMN content TO description;
ALTER TABLE public.updates RENAME COLUMN publish_date TO date;

-- ========================================
-- 4) Update indexes to reflect new table and column names
-- ========================================

-- Drop old indexes
DROP INDEX IF EXISTS public.idx_news_posts_publish_date;
DROP INDEX IF EXISTS public.idx_news_posts_publish_status;

-- Recreate indexes with new names
CREATE INDEX idx_updates_date ON public.updates(date);
CREATE INDEX idx_updates_publish_status ON public.updates(publish_status);

