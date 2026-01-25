"use client";

import { motion } from "framer-motion";
import { WorkflowCanvas } from "@/features/workflows/components/WorkflowCanvas";
import { useEntityWorkflows } from "@/features/workflows/hooks/useEntityWorkflows";
import { Loader2 } from "lucide-react";

type AlbumCanvasTabProps = {
  albumId: string;
  isNew: boolean;
};

export function AlbumCanvasTab({
  albumId,
  isNew,
}: AlbumCanvasTabProps) {
  const { workflows, isLoading: workflowsLoading, error: workflowsError } =
    useEntityWorkflows("albums");

  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to view the workflow canvas.
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {workflowsLoading ? (
        <div className="w-full flex items-center justify-center min-h-[600px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading workflow canvas...</p>
          </div>
        </div>
      ) : workflowsError ? (
        <div className="text-center py-12">
          <p className="text-sm text-destructive mb-2">Error loading workflows</p>
          <p className="text-xs text-muted-foreground">{workflowsError}</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No workflows available to display on canvas.
          </p>
        </div>
      ) : (
        <WorkflowCanvas workflows={workflows} />
      )}
    </motion.div>
  );
}
