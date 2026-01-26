-- Performance optimizations for Automations Tab
-- These indexes optimize queries used in the automations tab

BEGIN;

-- Optimize workflow_runs queries by entity
-- Used in: getWorkflowRunsByEntity() - filters by entity_type, entity_id, orders by started_at DESC
-- Query pattern: SELECT * FROM workflow_runs WHERE entity_type = X AND entity_id = Y ORDER BY started_at DESC LIMIT 10
CREATE INDEX IF NOT EXISTS idx_workflow_runs_entity_type_entity_id_started_at 
ON public.workflow_runs(entity_type, entity_id, started_at DESC);

-- Optimize workflow_presets queries by workflow_id and enabled
-- Used in: getPresetsForEntity() and getWorkflowPresets() - filters by workflow_id IN (...) AND enabled = true
-- Query pattern: SELECT * FROM workflow_presets WHERE workflow_id IN (...) AND enabled = true
CREATE INDEX IF NOT EXISTS idx_workflow_presets_workflow_id_enabled 
ON public.workflow_presets(workflow_id, enabled) 
WHERE enabled = true;

-- Optimize entity_type_workflows queries
-- Used in: getWorkflowsByEntityType() - filters by entity_type_id, orders by display_order
-- Query pattern: SELECT * FROM entity_type_workflows WHERE entity_type_id = X ORDER BY display_order ASC
-- This index already exists but ensure it's optimal
CREATE INDEX IF NOT EXISTS idx_entity_type_workflows_entity_type_display_order 
ON public.entity_type_workflows(entity_type_id, display_order);

-- Optimize entity_types lookup by slug
-- Used in: getPresetsForEntity() and getWorkflowsByEntityType() - frequently looks up entity_type by slug
-- Query pattern: SELECT id FROM entity_types WHERE slug = X
CREATE INDEX IF NOT EXISTS idx_entity_types_slug_covering 
ON public.entity_types(slug) 
INCLUDE (id);

COMMIT;
