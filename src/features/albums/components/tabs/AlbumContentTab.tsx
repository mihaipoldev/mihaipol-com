"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  const [albumImages, setAlbumImages] = useState<AlbumImage[]>(
    initialImages || initialAlbum?.album_images || []
  );
  const [albumAudios, setAlbumAudios] = useState<AlbumAudio[]>(
    initialAudios || initialAlbum?.album_audios || []
  );

  // Sync images when initialImages or initialAlbum changes
  useEffect(() => {
    const images = initialImages || initialAlbum?.album_images || [];
    setAlbumImages(images);
  }, [initialImages, initialAlbum?.album_images]);

  // Sync audios when initialAudios or initialAlbum changes
  useEffect(() => {
    const audios = initialAudios || initialAlbum?.album_audios || [];
    setAlbumAudios(audios);
  }, [initialAudios, initialAlbum?.album_audios]);

  const handleImagesChange = (images: AlbumImage[]) => {
    setAlbumImages(images);
    // Notify parent if callback provided
    onImagesChange?.(images);
  };

  const handleAudiosChange = (audios: AlbumAudio[]) => {
    setAlbumAudios(audios);
    // Notify parent if callback provided
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <AlbumImagesManager
          images={albumImages}
          onChange={handleImagesChange}
          folderPath={`albums/${albumId}`}
          coverImageUrl={coverImageUrl || null}
        />
      </motion.div>
      <Separator />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
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
