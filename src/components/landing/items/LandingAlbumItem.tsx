import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LandingAlbum } from "../types";

type LandingAlbumItemProps = {
  album: LandingAlbum;
  fallbackImage: string;
  isCircular?: boolean;
};

export default function LandingAlbumItem({ album, fallbackImage, isCircular = false }: LandingAlbumItemProps) {
  const albumType = (album.album_type ?? "Single").toUpperCase();
  const releaseInfo = album.release_date
    ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(
        new Date(album.release_date)
      )
    : "Release TBA";

  return (
    <div className="group transition-all duration-300 hover:-translate-y-2">
      <Link href={`/dev/albums/${album.slug}`}>
        <div
          className={cn(
            "aspect-square overflow-hidden relative mb-4 transition-shadow duration-300",
            "group-hover:shadow-card-hover",
            "isolate",
            isCircular ? "rounded-full" : "rounded-lg"
          )}
        >
          <img
            src={album.cover_image_url ?? fallbackImage}
            alt={album.title}
            className={cn(
              "w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 will-change-transform",
              isCircular ? "rounded-full" : "rounded-lg"
            )}
          />
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center rounded-full bg-background/60 backdrop-blur-md px-3 py-1 text-xs uppercase tracking-wide text-foreground font-semibold transition-all duration-300 group-hover:bg-background/100 group-hover:shadow-sm">
              {albumType}
            </span>
          </div>
        </div>
      </Link>
      <div className="text-center space-y-1">
        <h3 className="font-bold text-xl relative inline-block group-hover:text-foreground transition-all duration-300">
          <span className="relative pb-1">
            {album.title}
            <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
          </span>
        </h3>
        <p className="text-sm text-muted-foreground">{releaseInfo}</p>
      </div>
    </div>
  );
}
