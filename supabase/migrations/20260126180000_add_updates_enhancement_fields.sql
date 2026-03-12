-- Add enhancement fields to updates table
-- Adds: embeds, tags, is_featured, og_image_url, meta_description, external_links

BEGIN;

-- Add new columns to updates table
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS embeds jsonb,
ADD COLUMN IF NOT EXISTS tags text[],
ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS og_image_url text,
ADD COLUMN IF NOT EXISTS meta_description text,
ADD COLUMN IF NOT EXISTS external_links jsonb;

-- Add index for featured flag (partial index for better performance)
CREATE INDEX IF NOT EXISTS idx_updates_is_featured 
ON public.updates(is_featured) 
WHERE is_featured = true;

-- Add index for tags (GIN index for array operations)
CREATE INDEX IF NOT EXISTS idx_updates_tags 
ON public.updates USING gin(tags);

-- Add column comments for documentation
COMMENT ON COLUMN public.updates.embeds IS 'Array of embed objects: [{"type": "youtube", "url": "..."}, {"type": "spotify", "embed_code": "..."}]';
COMMENT ON COLUMN public.updates.tags IS 'Simple text array for categorization: ["release", "tour", "announcement"]';
COMMENT ON COLUMN public.updates.is_featured IS 'Flag to highlight important updates';
COMMENT ON COLUMN public.updates.og_image_url IS 'Custom Open Graph image for social sharing';
COMMENT ON COLUMN public.updates.meta_description IS 'SEO meta description for search engines and social previews';
COMMENT ON COLUMN public.updates.external_links IS 'Array of link objects: [{"label": "Listen on Spotify", "url": "..."}]';

COMMIT;
