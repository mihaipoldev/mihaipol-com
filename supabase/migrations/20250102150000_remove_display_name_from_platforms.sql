-- Remove display_name column from platforms table
ALTER TABLE public.platforms DROP COLUMN IF EXISTS display_name;

