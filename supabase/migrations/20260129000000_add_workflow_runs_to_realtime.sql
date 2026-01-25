-- Migration: Add workflow_runs table to Supabase Realtime publication
-- This enables realtime subscriptions for workflow_runs table changes

BEGIN;

-- Add workflow_runs table to the supabase_realtime publication
-- This allows clients to subscribe to INSERT, UPDATE, DELETE events on this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.workflow_runs;

COMMIT;
