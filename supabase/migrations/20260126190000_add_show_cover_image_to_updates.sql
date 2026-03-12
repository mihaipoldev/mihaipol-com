-- Add show_cover_image field to updates table
-- Controls whether the cover image is displayed on the detail page

BEGIN;

-- Add show_cover_image column with default true (to maintain existing behavior)
ALTER TABLE public.updates
ADD COLUMN IF NOT EXISTS show_cover_image boolean NOT NULL DEFAULT true;

-- Add column comment for documentation
COMMENT ON COLUMN public.updates.show_cover_image IS 'Controls whether the cover image is displayed on the detail page. Set to false when an embed (like YouTube) serves the same visual purpose.';

COMMIT;
