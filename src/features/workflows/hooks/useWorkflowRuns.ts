"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { WorkflowRun } from "../types/workflow.types";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

type UseWorkflowRunsResult = {
  runs: WorkflowRun[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useWorkflowRuns(
  entityType: string,
  entityId: string,
  limit: number = 10,
  pollInterval?: number,
  skipInitialFetch?: boolean, // New parameter to skip initial fetch if data already exists
  initialRuns?: WorkflowRun[] // Initial runs to use when skipping fetch
): UseWorkflowRunsResult {
  // Initialize with initialRuns if provided and skipping fetch
  const [runs, setRuns] = useState<WorkflowRun[]>(skipInitialFetch && initialRuns ? initialRuns : []);
  const [isLoading, setIsLoading] = useState(!skipInitialFetch); // Don't show loading if skipping initial fetch
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchRuns = useCallback(async () => {
    if (!entityType || !entityId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(
        `/api/admin/workflows/runs?entity_type=${entityType}&entity_id=${entityId}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch workflow runs");
      }
      const data = await response.json();
      setRuns(data);
    } catch (err: any) {
      console.error("Error fetching workflow runs:", err);
      setError(err.message || "Failed to load workflow runs");
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, limit]);

  // Initial fetch - skip if skipInitialFetch is true
  useEffect(() => {
    if (!skipInitialFetch) {
      fetchRuns();
    }
  }, [fetchRuns, skipInitialFetch]);

  // Sync initialRuns when they change (if we're skipping initial fetch and don't have realtime data yet)
  useEffect(() => {
    if (skipInitialFetch && initialRuns && initialRuns.length > 0 && runs.length === 0) {
      // Only set initial runs if we don't have any runs yet (before realtime subscription populates)
      setRuns(initialRuns);
    }
  }, [skipInitialFetch, initialRuns, runs.length]);

  // Set up realtime subscription
  useEffect(() => {
    if (!entityType || !entityId) return;

    const supabase = getSupabaseBrowser();
    
    // Create a channel for workflow_runs changes filtered by entity
    const channel = supabase
      .channel(`workflow_runs:${entityType}:${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "workflow_runs",
          filter: `entity_type=eq.${entityType}`,
        },
        (payload) => {
          // Only process events for this specific entity_id
          const run = (payload.new || payload.old) as any;
          if (!run || run.entity_id !== entityId) return;

          if (payload.eventType === "INSERT") {
            // New run inserted - add to the beginning of the list
            setRuns((currentRuns) => {
              const newRun = payload.new as WorkflowRun;
              // Check if it already exists (shouldn't happen, but safety check)
              if (currentRuns.some((r) => r.id === newRun.id)) {
                return currentRuns;
              }
              // Add to beginning and maintain limit
              const updated = [newRun, ...currentRuns].slice(0, limit);
              return updated;
            });
          } else if (payload.eventType === "UPDATE") {
            // Run updated - replace in the list
            setRuns((currentRuns) => {
              const updatedRun = payload.new as WorkflowRun;
              return currentRuns.map((run) =>
                run.id === updatedRun.id ? updatedRun : run
              );
            });
          } else if (payload.eventType === "DELETE") {
            // Run deleted - remove from the list
            setRuns((currentRuns) => {
              const deletedId = payload.old.id;
              return currentRuns.filter((run) => run.id !== deletedId);
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useWorkflowRuns] Subscribed to workflow_runs for ${entityType}:${entityId}`);
        } else if (status === "CHANNEL_ERROR") {
          console.error(`[useWorkflowRuns] Subscription error for ${entityType}:${entityId}`);
        }
      });

    channelRef.current = channel;

    // Cleanup subscription on unmount or when dependencies change
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [entityType, entityId, limit]);

  // Fallback polling for active runs (only if pollInterval is provided)
  // This can be removed once realtime subscriptions are confirmed working
  useEffect(() => {
    if (!pollInterval) return;

    const hasActiveRuns = runs.some((run) => run.status === "pending" || run.status === "running");
    if (!hasActiveRuns) return;

    const interval = setInterval(() => {
      fetchRuns();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [runs, pollInterval, fetchRuns]);

  return { runs, isLoading, error, refetch: fetchRuns };
}
