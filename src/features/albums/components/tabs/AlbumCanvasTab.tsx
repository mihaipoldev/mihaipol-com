"use client";

import { motion } from "framer-motion";
import { WorkflowCanvas } from "@/features/workflows/components/WorkflowCanvas";
import { useEntityWorkflows } from "@/features/workflows/hooks/useEntityWorkflows";
import { Loader2 } from "lucide-react";
import type { Workflow } from "@/features/workflows/types";

type AlbumCanvasTabProps = {
  albumId: string;
  isNew: boolean;
  initialWorkflows?: Workflow[]; // Pre-fetched workflows for instant loading
};

export function AlbumCanvasTab({
  albumId,
  isNew,
  initialWorkflows,
}: AlbumCanvasTabProps) {
  // Use pre-fetched workflows if available, otherwise fetch client-side
  const { workflows, isLoading: workflowsLoading, error: workflowsError } =
    useEntityWorkflows("albums", initialWorkflows);

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
        <motion.div
          className="w-full flex items-center justify-center min-h-[600px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading workflow canvas...</p>
          </div>
        </motion.div>
      ) : workflowsError ? (
        <motion.div
          className="text-center py-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-destructive mb-2">Error loading workflows</p>
          <p className="text-xs text-muted-foreground">{workflowsError}</p>
        </motion.div>
      ) : workflows.length === 0 ? (
        <motion.div
          className="text-center py-12 border rounded-lg"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-muted-foreground">
            No workflows available to display on canvas.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <WorkflowCanvas workflows={workflows} />
        </motion.div>
      )}
    </motion.div>
  );
}
