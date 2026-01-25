"use client";

import { useMemo } from "react";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";

type DataSourceResult<T> = {
  data: T[];
  isLoading: boolean;
  error: string | null;
};

export function useDataSource(
  dataSource: string | undefined,
  entityType: string,
  entityId: string,
  images: AlbumImage[],
  tracks: AlbumAudio[]
): DataSourceResult<AlbumImage | AlbumAudio> {
  return useMemo(() => {
    if (!dataSource) {
      return { data: [], isLoading: false, error: null };
    }

    // Parse data_source: "album.images" -> ["album", "images"]
    const [entity, relation] = dataSource.split(".");

    // For now, only support album entity type
    if (entity !== "album") {
      return {
        data: [],
        isLoading: false,
        error: `Unsupported entity type: ${entity}`,
      };
    }

    // Return appropriate data based on relation
    if (relation === "images") {
      return {
        data: images,
        isLoading: false,
        error: null,
      };
    }

    if (relation === "tracks") {
      return {
        data: tracks,
        isLoading: false,
        error: null,
      };
    }

    return {
      data: [],
      isLoading: false,
      error: `Unsupported relation: ${relation}`,
    };
  }, [dataSource, entityType, entityId, images, tracks]);
}
