-- Add circle_image_url column to albums table
-- This field stores a separate circular cropped version of the album cover image
-- The image is saved as PNG with transparent background for perfect circular display

ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS circle_image_url text;

COMMENT ON COLUMN public.albums.circle_image_url IS 'URL to a circular cropped version of the album cover image, saved as PNG with transparent background';
