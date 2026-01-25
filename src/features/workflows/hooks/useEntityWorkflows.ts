"use client";

import { useState, useEffect } from "react";
import type { Workflow } from "../types";

type UseEntityWorkflowsResult = {
  workflows: Workflow[];
  isLoading: boolean;
  error: string | null;
};

export function useEntityWorkflows(entityType: string): UseEntityWorkflowsResult {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [entityType]);

  return { workflows, isLoading, error };
}
