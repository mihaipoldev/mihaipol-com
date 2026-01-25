"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { WorkflowRun } from "../types/workflow.types";

type RunWorkflowParams = {
  workflow_id: string;
  entity_type: string;
  entity_id: string;
  input_data: Record<string, any>;
};

type UseRunWorkflowResult = {
  runWorkflow: (params: RunWorkflowParams) => Promise<WorkflowRun | null>;
  isRunning: boolean;
  error: string | null;
};

export function useRunWorkflow(): UseRunWorkflowResult {
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runWorkflow = async (params: RunWorkflowParams): Promise<WorkflowRun | null> => {
    try {
      setIsRunning(true);
      setError(null);

      console.log("[useRunWorkflow] Starting workflow run", {
        workflow_id: params.workflow_id,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        input_data: params.input_data,
      });

      const requestBody = {
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        input_data: params.input_data,
      };

      console.log("[useRunWorkflow] Request body:", JSON.stringify(requestBody, null, 2));
      console.log("[useRunWorkflow] Request URL:", `/api/workflows/${params.workflow_id}/run`);

      const response = await fetch(`/api/workflows/${params.workflow_id}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("[useRunWorkflow] Response status:", response.status, response.statusText);
      console.log("[useRunWorkflow] Response headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorData;
        try {
          const text = await response.text();
          console.error("[useRunWorkflow] Error response text:", text);
          errorData = JSON.parse(text);
          console.error("[useRunWorkflow] Error response parsed:", errorData);
        } catch (parseError) {
          console.error("[useRunWorkflow] Failed to parse error response:", parseError);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || errorData.message || "Failed to run workflow");
      }

      const result = await response.json();
      console.log("[useRunWorkflow] Success response:", result);
      toast.success("Workflow started! Check the activity below.");
      return result.run;
    } catch (err: any) {
      console.error("[useRunWorkflow] Error running workflow:", err);
      console.error("[useRunWorkflow] Error stack:", err.stack);
      const errorMessage = err.message || "Failed to run workflow";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsRunning(false);
    }
  };

  return { runWorkflow, isRunning, error };
}
