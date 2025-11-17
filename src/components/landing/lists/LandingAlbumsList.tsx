import LandingAlbumItem from "../items/LandingAlbumItem";
import type { LandingAlbum } from "../types";

type LandingAlbumsListProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
};

export default function LandingAlbumsList({ albums, fallbackImage }: LandingAlbumsListProps) {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
      {albums.map((album) => (
        <LandingAlbumItem key={album.id} album={album} fallbackImage={fallbackImage} />
      ))}
    </div>
  );
}
