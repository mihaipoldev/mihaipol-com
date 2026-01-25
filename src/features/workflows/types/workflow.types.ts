export type WorkflowRunStatus = "pending" | "running" | "completed" | "failed";

export type WorkflowRun = {
  id: string;
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  input_data: Record<string, any>;
  status: WorkflowRunStatus;
  execution_metadata: Record<string, any> | null;
  output_files: Record<string, any> | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  cost_breakdown: Record<string, any> | null;
  started_at: string;
  completed_at: string | null;
  workflow?: {
    id: string;
    name: string;
    icon: string | null;
  };
};

export type VideoEntry = {
  image_id: string;
  track_id: string;
  video_type: "short" | "long";
};

export type VideoWorkflowInput = {
  videos: VideoEntry[];
};
