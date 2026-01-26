-- Migration: Fix RLS Security Vulnerabilities
-- Adds Row Level Security policies to unprotected tables
-- 
-- Critical: Secures OAuth tokens and workflow secrets
-- High Priority: Adds public read/admin write to junction tables
-- Medium Priority: Restricts workflow tables to authenticated users only

BEGIN;

-- ========================================
-- CRITICAL: OAuth Tokens
-- ========================================
-- Contains sensitive OAuth access tokens and refresh tokens
-- Users can only manage their own tokens, admins can read all for support

ALTER TABLE public.oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Users can manage their own tokens (all operations)
DROP POLICY IF EXISTS "users can manage own oauth_tokens" ON public.oauth_tokens;
CREATE POLICY "users can manage own oauth_tokens"
  ON public.oauth_tokens FOR ALL
  USING (auth.uid() = user_id);

-- Admins can read all tokens (for support/debugging)
DROP POLICY IF EXISTS "admin can read all oauth_tokens" ON public.oauth_tokens;
CREATE POLICY "admin can read all oauth_tokens"
  ON public.oauth_tokens FOR SELECT
  USING (public.is_admin(auth.uid()));

-- ========================================
-- CRITICAL: Workflow Secrets
-- ========================================
-- Contains sensitive API keys and webhook URLs
-- Admin-only access (no public or regular user access)

ALTER TABLE public.workflow_secrets ENABLE ROW LEVEL SECURITY;

-- Admin-only access (highly sensitive)
DROP POLICY IF EXISTS "admin only workflow_secrets" ON public.workflow_secrets;
CREATE POLICY "admin only workflow_secrets"
  ON public.workflow_secrets FOR ALL
  USING (public.is_admin(auth.uid()));

-- ========================================
-- HIGH PRIORITY: Junction Tables
-- ========================================
-- Public read access (everyone can read)
-- Admin-only write access (only admins can modify)

-- album_artists: Album-artist relationships
ALTER TABLE public.album_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read album_artists" ON public.album_artists;
CREATE POLICY "public can read album_artists"
  ON public.album_artists FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin full album_artists" ON public.album_artists;
CREATE POLICY "admin full album_artists"
  ON public.album_artists FOR ALL
  USING (public.is_admin(auth.uid()));

-- album_links: Album platform links (critical for smart links functionality)
ALTER TABLE public.album_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read album_links" ON public.album_links;
CREATE POLICY "public can read album_links"
  ON public.album_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin full album_links" ON public.album_links;
CREATE POLICY "admin full album_links"
  ON public.album_links FOR ALL
  USING (public.is_admin(auth.uid()));

-- event_artists: Event-artist relationships
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can read event_artists" ON public.event_artists;
CREATE POLICY "public can read event_artists"
  ON public.event_artists FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "admin full event_artists" ON public.event_artists;
CREATE POLICY "admin full event_artists"
  ON public.event_artists FOR ALL
  USING (public.is_admin(auth.uid()));

-- ========================================
-- MEDIUM PRIORITY: Workflow Tables
-- ========================================
-- Hidden from anonymous users
-- Authenticated users can read
-- Admin-only write access

-- entity_types: Entity type definitions
ALTER TABLE public.entity_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read entity_types" ON public.entity_types;
CREATE POLICY "authenticated users can read entity_types"
  ON public.entity_types FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full entity_types" ON public.entity_types;
CREATE POLICY "admin full entity_types"
  ON public.entity_types FOR ALL
  USING (public.is_admin(auth.uid()));

-- workflows: Workflow definitions
ALTER TABLE public.workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read workflows" ON public.workflows;
CREATE POLICY "authenticated users can read workflows"
  ON public.workflows FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full workflows" ON public.workflows;
CREATE POLICY "admin full workflows"
  ON public.workflows FOR ALL
  USING (public.is_admin(auth.uid()));

-- entity_type_workflows: Entity type to workflow associations
ALTER TABLE public.entity_type_workflows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read entity_type_workflows" ON public.entity_type_workflows;
CREATE POLICY "authenticated users can read entity_type_workflows"
  ON public.entity_type_workflows FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full entity_type_workflows" ON public.entity_type_workflows;
CREATE POLICY "admin full entity_type_workflows"
  ON public.entity_type_workflows FOR ALL
  USING (public.is_admin(auth.uid()));

-- workflow_runs: Workflow execution history
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read workflow_runs" ON public.workflow_runs;
CREATE POLICY "authenticated users can read workflow_runs"
  ON public.workflow_runs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full workflow_runs" ON public.workflow_runs;
CREATE POLICY "admin full workflow_runs"
  ON public.workflow_runs FOR ALL
  USING (public.is_admin(auth.uid()));

-- workflow_run_outputs: Workflow execution outputs
ALTER TABLE public.workflow_run_outputs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read workflow_run_outputs" ON public.workflow_run_outputs;
CREATE POLICY "authenticated users can read workflow_run_outputs"
  ON public.workflow_run_outputs FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full workflow_run_outputs" ON public.workflow_run_outputs;
CREATE POLICY "admin full workflow_run_outputs"
  ON public.workflow_run_outputs FOR ALL
  USING (public.is_admin(auth.uid()));

-- workflow_presets: Pre-configured workflow presets
ALTER TABLE public.workflow_presets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated users can read workflow_presets" ON public.workflow_presets;
CREATE POLICY "authenticated users can read workflow_presets"
  ON public.workflow_presets FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "admin full workflow_presets" ON public.workflow_presets;
CREATE POLICY "admin full workflow_presets"
  ON public.workflow_presets FOR ALL
  USING (public.is_admin(auth.uid()));

COMMIT;
