-- Add button_action column
ALTER TABLE public.platforms ADD COLUMN IF NOT EXISTS button_action text;

-- Remove is_active and sort_order columns
ALTER TABLE public.platforms DROP COLUMN IF EXISTS is_active;
ALTER TABLE public.platforms DROP COLUMN IF EXISTS sort_order;

