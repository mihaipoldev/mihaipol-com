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
    <div className="relative space-y-0 rounded-xl overflow-hidden bg-card/50 dark:bg-card/30 backdrop-blur-sm bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent shadow-lg">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      {/* Sparkle decorations */}
      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse z-10" />
      <div
        className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse z-10"
        style={{ animationDelay: "300ms" }}
      />

      <div className="relative z-[5]">
        {runs.map((run) => (
          <RunRow
            key={run.id}
            run={run}
            expanded={expandedRuns.has(run.id)}
            onToggle={() => onToggleRun(run.id)}
          />
        ))}
      </div>
    </div>
  );
}
