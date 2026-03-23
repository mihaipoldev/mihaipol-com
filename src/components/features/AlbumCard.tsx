import Link from "next/link";
import { cn } from "@/lib/utils";

export type AlbumCardProps = {
  id: string;
  slug: string;
  title: string;
  cover_image_url?: string | null;
  cover_media?: { id: string; url: string }[] | null;
  labelName?: string | null;
  release_date?: string | null;
  className?: string;
};

export default function AlbumCard({
  id,
  slug,
  title,
  cover_image_url,
  cover_media,
  labelName,
  release_date,
  className,
}: AlbumCardProps) {
  return (
    <Link href={`/albums/${slug}`} className={cn("group", className)} target="_blank" rel="noopener noreferrer">
      <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
        <div className="aspect-square bg-muted overflow-hidden rounded-lg">
          {(cover_media?.[0]?.url || cover_image_url) ? (
            <img
              src={cover_media?.[0]?.url || cover_image_url!}
              alt={title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground rounded-lg">
              No Image
            </div>
          )}
        </div>
        <div className="py-4 flex-1 flex flex-col bg-transparent px-3 text-center">
          <h3 className="font-semibold text-lg mb-1 relative inline-block">
            <span className="relative z-10">{title}</span>
            <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
          </h3>
          {labelName && <p className="text-sm text-muted-foreground mb-1">{labelName}</p>}
        </div>
      </div>
    </Link>
  );
}
