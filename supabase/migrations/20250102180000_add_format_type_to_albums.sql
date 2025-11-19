-- Add format_type column to albums table
-- This allows filtering albums by physical/digital format (CD, Vinyl, Digital, etc.)

BEGIN;

-- Add format_type column to albums table
ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS format_type text;

-- Add index on format_type for filtering performance
CREATE INDEX IF NOT EXISTS idx_albums_format_type 
ON public.albums(format_type);

COMMIT;

