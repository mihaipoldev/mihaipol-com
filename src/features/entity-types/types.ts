import type { Workflow } from "@/features/workflows/types";

export type EntityType = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type EntityTypeWithWorkflows = EntityType & {
  workflows: Workflow[];
};

export type EntityTypeWorkflow = {
  id: string;
  entity_type_id: string;
  workflow_id: string;
  display_order: number;
  created_at: string;
  workflow?: Workflow;
};
