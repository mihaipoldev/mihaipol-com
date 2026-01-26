"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../types";

type UseEntityWorkflowsResult = {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
};

/**
 * Hook to fetch workflows for an entity type
 * If initialWorkflows are provided, uses them immediately and skips the API call
 * (for server-side pre-fetched data, similar to how images/audios work)
 */
export function useEntityWorkflows(
  entityType: string,
  initialWorkflows?: Workflow[]
): UseEntityWorkflowsResult {
  // Initialize with pre-fetched workflows if available (instant loading!)
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows || []);
  const [isLoading, setIsLoading] = useState(!initialWorkflows); // No loading if we have initial data
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we have initial workflows, skip the fetch (data already loaded server-side)
    if (initialWorkflows) {
      setIsLoading(false);
      return;
    }

    if (!entityType) {
      setIsLoading(false);
      return;
    }

    const fetchWorkflows = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/workflows?entity_type=${entityType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch workflows");
        }
        const data = await response.json();
        setWorkflows(data);
      } catch (err: any) {
        console.error("Error fetching workflows:", err);
        setError(err.message || "Failed to load workflows");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkflows();
  }, [entityType, initialWorkflows]);

  return { workflows, isLoading, error };
}
