-- Migration: Add flyer_image_url column to events table
-- Adds a flyer_image_url field to store promotional images for events

BEGIN;

-- Add flyer_image_url column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_image_url text;

COMMIT;

