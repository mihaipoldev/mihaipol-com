"use client";

import { motion } from "framer-motion";
import { AutomationsTab } from "@/features/workflows/components/AutomationsTab";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";

type AlbumAutomationsTabProps = {
  albumId: string;
  isNew: boolean;
  initialImages?: AlbumImage[];
  initialAudios?: AlbumAudio[];
};

export function AlbumAutomationsTab({
  albumId,
  isNew,
  initialImages = [],
  initialAudios = [],
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
        images={initialImages}
        tracks={initialAudios}
      />
    </motion.div>
  );
}
