-- Migration: Create workflow_presets table
-- Enables pre-configured automation workflows with smart matching of images and tracks

-- ========================================
-- TABLE: public.workflow_presets
-- ========================================

CREATE TABLE public.workflow_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  
  -- Basic info
  name text NOT NULL,
  description text,
  icon text,
  
  -- Preset configuration
  matching_config jsonb NOT NULL,
  video_settings jsonb NOT NULL,
  
  -- Metadata
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_presets_workflow_id ON public.workflow_presets(workflow_id);
CREATE INDEX idx_workflow_presets_enabled ON public.workflow_presets(enabled);

-- Trigger for updated_at timestamp
CREATE TRIGGER update_workflow_presets_updated_at
  BEFORE UPDATE ON public.workflow_presets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.workflow_presets IS 'Pre-configured automation workflows with smart matching rules for images and tracks';
COMMENT ON COLUMN public.workflow_presets.matching_config IS 'JSONB configuration for matching images and tracks (image_selection filters, track_grouping strategy)';
COMMENT ON COLUMN public.workflow_presets.video_settings IS 'JSONB configuration for video output settings (quality, aspect_ratio, format, etc.)';
