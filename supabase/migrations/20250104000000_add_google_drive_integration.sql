-- Migration: Add Google Drive integration and content generation features
-- Creates oauth_tokens and generated_assets tables, and adds Drive-related columns
-- to albums, events, and updates tables

BEGIN;

-- ========================================
-- TABLE: public.oauth_tokens
-- ========================================

CREATE TABLE IF NOT EXISTS public.oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for oauth_tokens
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_user_id ON public.oauth_tokens(user_id);

-- Unique index to ensure one token per user per provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_oauth_tokens_user_provider 
ON public.oauth_tokens(user_id, provider);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.oauth_tokens;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.oauth_tokens
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ========================================
-- TABLE: public.generated_assets
-- ========================================

CREATE TABLE IF NOT EXISTS public.generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('album', 'event', 'update')),
  entity_id uuid NOT NULL,
  asset_type text NOT NULL CHECK (asset_type IN ('youtube_video', 'instagram_video', 'story_video')),
  file_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for generated_assets
CREATE INDEX IF NOT EXISTS idx_generated_assets_entity 
ON public.generated_assets(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_generated_assets_status 
ON public.generated_assets(status);

CREATE INDEX IF NOT EXISTS idx_generated_assets_created_at 
ON public.generated_assets(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.generated_assets;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.generated_assets
  FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ========================================
-- ADD COLUMNS TO EXISTING TABLES
-- ========================================

-- Add Google Drive columns to albums table
ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS drive_folder_id text;

ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS drive_folder_url text;

ALTER TABLE public.albums 
ADD COLUMN IF NOT EXISTS audio_files jsonb;

-- Add Google Drive columns to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS drive_folder_id text;

ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS drive_folder_url text;

-- Add Google Drive columns to updates table
ALTER TABLE public.updates 
ADD COLUMN IF NOT EXISTS drive_folder_id text;

ALTER TABLE public.updates 
ADD COLUMN IF NOT EXISTS drive_folder_url text;

COMMIT;
