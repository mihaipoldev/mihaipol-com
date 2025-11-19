import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatUpdateDate } from "../utils";
import type { LandingUpdate } from "../types";
import { cn } from "@/lib/utils";

export type UpdateCardVariant =
  | "default" // Vertical stack: image on top, content below (original)
  | "horizontal" // Image on left, content on right
  | "overlay" // Text overlaid on image with gradient
  | "compact" // Smaller, more condensed (horizontal/rectangular)
  | "compact-square" // Smaller, more condensed (square image)
  | "featured" // Larger image with prominent text
  | "minimal" // Very clean, minimal design
  | "card-badge"; // Original card with badge design

type LandingUpdateItemProps = {
  update: LandingUpdate;
  fallbackImage: string;
  variant?: UpdateCardVariant;
};

export default function LandingUpdateItem({
  update,
  fallbackImage,
  variant = "card-badge",
}: LandingUpdateItemProps) {
  const imageUrl = update.image_url ?? fallbackImage;

  // Card-badge variant - Original design with badge
  if (variant === "card-badge") {
    return (
      <Card className="overflow-hidden group hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur">
        <Link href={`/dev/updates/${update.slug}`}>
          <div className="aspect-video overflow-hidden">
            <img
              src={imageUrl}
              alt={update.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        </Link>
        <div className="p-6 space-y-4">
          <Badge variant="secondary">Update</Badge>
          <div>
            <h3 className="font-bold text-lg mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                {update.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{formatUpdateDate(update.date)}</p>
          </div>
        </div>
      </Card>
    );
  }

  // Default variant - Vertical stack
  if (variant === "default") {
    return (
      <div className="transition-all duration-300 hover:-translate-y-2 h-full">
        <Link href={`/dev/updates/${update.slug}`} className="group h-full block">
          <div className="rounded-lg transition-all duration-200 h-full flex flex-col">
            {imageUrl && (
              <div className="aspect-video bg-muted overflow-hidden rounded-lg transition-shadow duration-300 group-hover:shadow-card-hover isolate">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                />
              </div>
            )}
            <div className="py-4 flex-1 flex flex-col bg-transparent px-3">
              <h3 className="font-semibold text-lg mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.date && (
                <p className="text-sm text-muted-foreground mb-2">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              {update.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{update.description}</p>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Horizontal variant - Image on left, content on right
  if (variant === "horizontal") {
    return (
      <Link href={`/dev/updates/${update.slug}`} className="group h-full">
        <Card className="overflow-hidden group hover:shadow-card-hover transition-all duration-300 h-full flex gap-4 p-4">
          {imageUrl && (
            <div className="w-32 h-32 flex-shrink-0 bg-muted overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {update.date && (
              <p className="text-xs text-muted-foreground mb-1">{formatUpdateDate(update.date)}</p>
            )}
            <h3 className="font-semibold text-base mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1 block line-clamp-2">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
            )}
          </div>
        </Card>
      </Link>
    );
  }

  // Overlay variant - Text overlaid on image
  if (variant === "overlay") {
    return (
      <Link href={`/dev/updates/${update.slug}`} className="group h-full">
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full relative">
          {imageUrl ? (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg relative">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                {update.date && (
                  <p className="text-xs text-white/80 mb-1">{formatUpdateDate(update.date)}</p>
                )}
                <h3 className="font-semibold text-lg mb-2 relative inline-block transition-all duration-300">
                  <span className="relative pb-1">
                    {update.title}
                    <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-white transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                  </span>
                </h3>
                {update.description && (
                  <p className="text-sm text-white/90 line-clamp-2">{update.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg p-4 flex flex-col justify-end">
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              <h3 className="font-semibold text-lg mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{update.description}</p>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Compact variant - Smaller, more condensed (horizontal/rectangular)
  if (variant === "compact") {
    return (
      <div className="group transition-all duration-300 hover:-translate-y-2 h-full">
        <Link href={`/dev/updates/${update.slug}`} className="h-full block">
          <div className="rounded-lg transition-all duration-200 h-full flex flex-col">
            {imageUrl && (
              <div className="aspect-video bg-muted overflow-hidden rounded-lg transition-shadow duration-300 group-hover:shadow-card-hover isolate">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                />
              </div>
            )}
            <div className="py-3 flex-1 flex flex-col px-2">
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              <h3 className="font-semibold text-sm mb-1 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1 block line-clamp-2">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Compact-square variant - Smaller, more condensed (square image)
  if (variant === "compact-square") {
    return (
      <div className="group transition-all duration-300 hover:-translate-y-2 h-full">
        <Link href={`/dev/updates/${update.slug}`} className="h-full block">
          <div className="rounded-lg transition-all duration-200 h-full flex flex-col">
            {imageUrl && (
              <div className="aspect-square bg-muted overflow-hidden rounded-lg transition-shadow duration-300 group-hover:shadow-card-hover isolate">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 rounded-lg"
                />
              </div>
            )}
            <div className="py-3 flex-1 flex flex-col px-2">
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              <h3 className="font-semibold text-sm mb-1 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1 block line-clamp-2">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
              )}
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Featured variant - Larger image with prominent text
  if (variant === "featured") {
    return (
      <Link href={`/dev/updates/${update.slug}`} className="group h-full">
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
          {imageUrl && (
            <div className="aspect-[4/3] bg-muted overflow-hidden rounded-lg">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="py-5 flex-1 flex flex-col px-4">
            {update.date && (
              <p className="text-sm text-muted-foreground mb-2 font-medium">
                {formatUpdateDate(update.date)}
              </p>
            )}
            <h3 className="font-bold text-xl mb-3 relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.description && (
              <p className="text-base text-muted-foreground line-clamp-4 leading-relaxed">
                {update.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Minimal variant - Very clean, minimal design
  if (variant === "minimal") {
    return (
      <Link href={`/dev/updates/${update.slug}`} className="group h-full">
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col border border-border">
          {imageUrl && (
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
            </div>
          )}
          <div className="py-4 flex-1 flex flex-col px-4">
            {update.date && (
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                {formatUpdateDate(update.date)}
              </p>
            )}
            <h3 className="font-medium text-base mb-3 leading-tight relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {update.description}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return null;
}
