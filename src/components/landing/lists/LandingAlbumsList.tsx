import LandingAlbumItem from "../items/LandingAlbumItem";
import type { LandingAlbum } from "../types";
import { cn } from "@/lib/utils";

type LandingAlbumsListProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
  columns?: 3 | 4;
};

export default function LandingAlbumsList({ albums, fallbackImage, columns = 3 }: LandingAlbumsListProps) {
  const gridClasses = columns === 4
    ? "grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto"
    : "grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto";

  return (
    <div className={cn(gridClasses)}>
      {albums.map((album) => (
        <LandingAlbumItem key={album.id} album={album} fallbackImage={fallbackImage} />
      ))}
    </div>
  );
}
