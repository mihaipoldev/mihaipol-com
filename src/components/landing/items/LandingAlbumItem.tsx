import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { LandingAlbum } from "../types";

type LandingAlbumItemProps = {
  album: LandingAlbum;
  fallbackImage: string;
};

export default function LandingAlbumItem({ album, fallbackImage }: LandingAlbumItemProps) {
  const catalog = album.catalog_number ?? "CAT TBD";
  const releaseInfo = album.release_date
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
        new Date(album.release_date)
      )
    : "Release TBA";
  const albumType = (album.album_type ?? "Single").toUpperCase();

  return (
    <Card className="overflow-hidden group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-2 bg-card/80 backdrop-blur border border-border/60">
      <Link href={`/dev/albums/${album.slug}`}>
        <div className="aspect-square overflow-hidden relative">
          <img
            src={album.cover_image_url ?? fallbackImage}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-x-6 bottom-6 rounded-full bg-background/80 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground/80 py-2 backdrop-blur">
            {catalog}
          </div>
        </div>
      </Link>
      <div className="p-6 space-y-3 text-center">
        <h3 className="font-bold text-xl">{album.title}</h3>
        <p className="text-sm text-muted-foreground">{releaseInfo}</p>
        <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="inline-flex items-center rounded-full bg-secondary/40 px-3 py-1 text-secondary-foreground/80 font-semibold">
            {albumType}
          </span>
        </div>
      </div>
    </Card>
  );
}
