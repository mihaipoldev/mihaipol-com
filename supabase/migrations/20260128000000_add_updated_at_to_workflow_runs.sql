-- Migration: Add updated_at column to workflow_runs table
-- This column is needed for tracking when workflow runs are updated

BEGIN;

-- Add updated_at column
ALTER TABLE public.workflow_runs 
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_workflow_runs_updated_at
  BEFORE UPDATE ON public.workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
