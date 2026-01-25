-- Add cover_shape column to albums table
-- This field determines whether album covers should be displayed as square (rounded corners) or circular

ALTER TABLE public.albums 
ADD COLUMN cover_shape text DEFAULT 'square' CHECK (cover_shape IN ('square', 'circle'));

COMMENT ON COLUMN public.albums.cover_shape IS 'Determines the display shape of the album cover: square (rounded corners) or circle (fully rounded)';
