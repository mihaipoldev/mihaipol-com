export type Workflow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  estimated_cost: number | null;
  estimated_time_minutes: number | null;
  input_schema: Record<string, any> | null;
  enabled: boolean;
  default_ai_model: string;
  created_at: string;
  updated_at: string;
};

export type WorkflowSecrets = {
  workflow_id: string;
  webhook_url: string;
  api_key: string | null;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
};
