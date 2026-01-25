"use client";

import AlbumItem from "../items/AlbumItem";
import StaggerContainer from "../animations/StaggerContainer";
import type { LandingAlbum } from "../types";
import { cn } from "@/lib/utils";

type AlbumsListProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
  columns?: 3 | 4 | 5;
};

export default function AlbumsList({
  albums,
  fallbackImage,
  columns = 3,
}: AlbumsListProps) {
  const gridClasses =
    columns === 5
      ? "grid md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-[1200px] mx-auto"
      : columns === 4
        ? "grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1200px] mx-auto"
        : "grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto";

  return (
    <StaggerContainer 
      key={albums.map(a => a.id).join(',')}
      className={cn(gridClasses)}
    >
      {albums.map((album) => (
        <AlbumItem
          key={album.id}
          album={album}
          fallbackImage={fallbackImage}
        />
      ))}
    </StaggerContainer>
  );
}
