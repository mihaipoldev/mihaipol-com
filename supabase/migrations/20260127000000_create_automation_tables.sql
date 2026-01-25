-- Migration: Create automation tracking tables
-- Creates tables for entity types, workflows, workflow secrets, entity type workflows,
-- workflow runs, and workflow run outputs

-- ========================================
-- TABLE: public.entity_types
-- ========================================

CREATE TABLE public.entity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_entity_types_slug ON public.entity_types(slug);
CREATE INDEX idx_entity_types_enabled ON public.entity_types(enabled);

-- ========================================
-- TABLE: public.workflows
-- ========================================

CREATE TABLE public.workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  estimated_cost numeric(10, 4),
  estimated_time_minutes integer,
  input_schema jsonb,
  enabled boolean NOT NULL DEFAULT true,
  default_ai_model text NOT NULL DEFAULT 'anthropic/claude-haiku-4.5',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflows_slug ON public.workflows(slug);
CREATE INDEX idx_workflows_enabled ON public.workflows(enabled);

-- ========================================
-- TABLE: public.workflow_secrets
-- ========================================

CREATE TABLE public.workflow_secrets (
  workflow_id uuid PRIMARY KEY REFERENCES public.workflows(id) ON DELETE CASCADE,
  webhook_url text NOT NULL,
  api_key text,
  config jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ========================================
-- TABLE: public.entity_type_workflows
-- ========================================

CREATE TABLE public.entity_type_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type_id uuid NOT NULL REFERENCES public.entity_types(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  display_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type_id, workflow_id)
);

CREATE INDEX idx_entity_type_workflows_entity_type_order ON public.entity_type_workflows(entity_type_id, display_order);
CREATE INDEX idx_entity_type_workflows_workflow_id ON public.entity_type_workflows(workflow_id);

-- ========================================
-- TABLE: public.workflow_runs
-- ========================================

CREATE TABLE public.workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES public.workflows(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  input_data jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  execution_metadata jsonb DEFAULT '{}',
  output_files jsonb,
  estimated_cost numeric(10, 4),
  actual_cost numeric(10, 4),
  cost_breakdown jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT workflow_runs_status_check CHECK (status IN ('pending', 'running', 'completed', 'failed'))
);

CREATE INDEX idx_workflow_runs_entity ON public.workflow_runs(entity_type, entity_id);
CREATE INDEX idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_workflow_runs_started_at ON public.workflow_runs(started_at DESC);

-- ========================================
-- TABLE: public.workflow_run_outputs
-- ========================================

CREATE TABLE public.workflow_run_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  output_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX workflow_run_outputs_run_id_uq ON public.workflow_run_outputs(run_id);

-- ========================================
-- TRIGGERS: Update updated_at timestamps
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_entity_types_updated_at
  BEFORE UPDATE ON public.entity_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON public.workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_secrets_updated_at
  BEFORE UPDATE ON public.workflow_secrets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
