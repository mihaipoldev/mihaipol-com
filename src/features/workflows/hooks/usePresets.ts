"use client";

import { useState, useEffect } from "react";
import type { WorkflowPreset } from "../presets/types";

type UsePresetsResult = {
  presets: WorkflowPreset[];
  isLoading: boolean;
  error: string | null;
};

export function usePresets(entityType: string): UsePresetsResult {
  const [presets, setPresets] = useState<WorkflowPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityType) {
      setIsLoading(false);
      return;
    }

    const fetchPresets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/workflows/presets?entity_type=${entityType}`);
        if (!response.ok) {
          throw new Error("Failed to fetch presets");
        }
        const data = await response.json();
        setPresets(data);
      } catch (err: any) {
        console.error("Error fetching presets:", err);
        setError(err.message || "Failed to load presets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPresets();
  }, [entityType]);

  return { presets, isLoading, error };
}
