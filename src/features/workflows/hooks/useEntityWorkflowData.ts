"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../types";
import type { WorkflowPreset } from "../presets/types";
import type { WorkflowRun } from "../types/workflow.types";
import type { EntityWorkflowData } from "../data-server";

type UseEntityWorkflowDataResult = {
  workflows: Workflow[];
  presets: WorkflowPreset[];
  runs: WorkflowRun[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Combined hook that fetches workflows, presets, and runs in a single API call
 * This replaces 3 separate hooks (useEntityWorkflows, usePresets, useWorkflowRuns)
 * and significantly improves performance by reducing network round trips
 * 
 * If initialWorkflowData is provided, uses it immediately and skips the API call
 * (for server-side pre-fetched data, similar to how images/audios work)
 */
export function useEntityWorkflowData(
  entityType: string,
  entityId: string | null,
  runsLimit: number = 10,
  initialWorkflowData?: EntityWorkflowData // Pre-fetched data from server
): UseEntityWorkflowDataResult {
  // Initialize with pre-fetched data if available (instant loading!)
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflowData?.workflows || []);
  const [presets, setPresets] = useState<WorkflowPreset[]>(initialWorkflowData?.presets || []);
  const [runs, setRuns] = useState<WorkflowRun[]>(initialWorkflowData?.runs || []);
  const [isLoading, setIsLoading] = useState(!initialWorkflowData); // No loading if we have initial data
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have initial data, skip the fetch (data already loaded server-side)
    if (initialWorkflowData) {
      setIsLoading(false);
      return;
    }

    if (!entityType) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Single API call instead of 3 separate calls
        const params = new URLSearchParams({
          entity_type: entityType,
          runs_limit: runsLimit.toString(),
        });
        
        if (entityId) {
          params.append("entity_id", entityId);
        }

        const response = await fetch(`/api/admin/workflows/entity-data?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch workflow data");
        }
        
        const data = await response.json();
        setWorkflows(data.workflows || []);
        setPresets(data.presets || []);
        setRuns(data.runs || []);
      } catch (err: any) {
        console.error("Error fetching workflow data:", err);
        setError(err.message || "Failed to load workflow data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [entityType, entityId, runsLimit, initialWorkflowData]);

  return { workflows, presets, runs, isLoading, error };
}
