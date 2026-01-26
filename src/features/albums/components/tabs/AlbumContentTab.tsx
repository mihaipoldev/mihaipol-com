"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlbumImagesManager } from "../AlbumImagesManager";
import { AlbumAudiosManager } from "../AlbumAudiosManager";
import { Separator } from "@/components/ui/separator";
import type { Album, AlbumImage, AlbumAudio } from "@/features/albums/types";

type AlbumContentTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialImages?: AlbumImage[];
  initialAudios?: AlbumAudio[];
  coverImageUrl?: string | null;
  onImagesChange?: (images: AlbumImage[]) => void;
  onAudiosChange?: (audios: AlbumAudio[]) => void;
};

export function AlbumContentTab({
  albumId,
  isNew,
  initialAlbum,
  initialImages,
  initialAudios,
  coverImageUrl,
  onImagesChange,
  onAudiosChange,
}: AlbumContentTabProps) {
  // No local state - parent manages everything
  // Use props directly to avoid duplicate syncing
  const albumImages = initialImages || initialAlbum?.album_images || [];
  const albumAudios = initialAudios || initialAlbum?.album_audios || [];

  // Wrapper functions to handle optional callbacks
  const handleImagesChange = (images: AlbumImage[]) => {
    onImagesChange?.(images);
  };

  const handleAudiosChange = (audios: AlbumAudio[]) => {
    onAudiosChange?.(audios);
  };

  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to add content images and audio files.
      </motion.p>
    );
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <AlbumImagesManager
          images={albumImages}
          onChange={handleImagesChange}
          folderPath={`albums/${albumId}`}
          coverImageUrl={coverImageUrl || null}
        />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <AlbumAudiosManager
          audios={albumAudios}
          onChange={handleAudiosChange}
          folderPath={`albums/${albumId}`}
        />
      </motion.div>
    </motion.div>
  );
}
