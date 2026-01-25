"use client";

import { RunRow } from "./RunRow";
import { Loader2 } from "lucide-react";
import type { WorkflowRun } from "../types/workflow.types";

type RunHistoryProps = {
  runs: WorkflowRun[];
  isLoading: boolean;
  expandedRuns: Set<string>;
  onToggleRun: (runId: string) => void;
};

export function RunHistory({ runs, isLoading, expandedRuns, onToggleRun }: RunHistoryProps) {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading run history...</p>
        </div>
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">
          No automation runs yet. Configure a workflow above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0 border border-border rounded-lg overflow-hidden bg-card">
      {runs.map((run) => (
        <RunRow
          key={run.id}
          run={run}
          expanded={expandedRuns.has(run.id)}
          onToggle={() => onToggleRun(run.id)}
        />
      ))}
    </div>
  );
}
