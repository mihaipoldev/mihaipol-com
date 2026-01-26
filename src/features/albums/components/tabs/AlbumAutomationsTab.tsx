"use client";

import { motion } from "framer-motion";
import { AutomationsTab } from "@/features/workflows/components/AutomationsTab";
import type { EntityWorkflowData } from "@/features/workflows/data-server";

type AlbumAutomationsTabProps = {
  albumId: string;
  isNew: boolean;
  initialWorkflowData?: EntityWorkflowData; // Pre-fetched workflow data for instant loading
};

export function AlbumAutomationsTab({
  albumId,
  isNew,
  initialWorkflowData,
}: AlbumAutomationsTabProps) {
  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to use automations.
      </motion.p>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <AutomationsTab
        entityType="albums"
        entityId={albumId}
        initialWorkflowData={initialWorkflowData}
        // Images and tracks are fetched lazily when ConfigurationSidePanel opens
      />
    </motion.div>
  );
}
