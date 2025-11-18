import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type UpdateCardVariant = 
  | "default"      // Vertical stack: image on top, content below
  | "horizontal"   // Image on left, content on right
  | "overlay"      // Text overlaid on image with gradient
  | "compact"      // Smaller, more condensed (horizontal/rectangular)
  | "compact-square" // Smaller, more condensed (square image)
  | "featured"     // Larger image with prominent text
  | "minimal";     // Very clean, minimal design

export type UpdateCardProps = {
  id: string;
  slug: string;
  title: string;
  image_url?: string | null;
  date?: string | null;
  description?: string | null;
  className?: string;
  variant?: UpdateCardVariant;
};

export default function UpdateCard({
  id,
  slug,
  title,
  image_url,
  date,
  description,
  className,
  variant = "default",
}: UpdateCardProps) {
  // Default variant - Vertical stack
  if (variant === "default") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-80 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
          {image_url && (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="py-4 flex-1 flex flex-col bg-transparent px-3">
            <h3 className="font-semibold text-lg mb-2 relative inline-block">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {date && <p className="text-sm text-muted-foreground mb-2">{formatDate(date)}</p>}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal variant - Image on left, content on right
  if (variant === "horizontal") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-80 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex gap-4">
          {image_url && (
            <div className="w-32 h-32 flex-shrink-0 bg-muted overflow-hidden rounded-lg">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {date && <p className="text-xs text-muted-foreground mb-1">{formatDate(date)}</p>}
            <h3 className="font-semibold text-base mb-2 relative inline-block line-clamp-2">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Overlay variant - Text overlaid on image
  if (variant === "overlay") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-80 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full relative">
          {image_url ? (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg relative">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-lg" />
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                {date && <p className="text-xs text-white/80 mb-1">{formatDate(date)}</p>}
                <h3 className="font-semibold text-lg mb-2 relative inline-block">
                  <span className="relative z-10">{title}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300 ease-out"></span>
                </h3>
                {description && (
                  <p className="text-sm text-white/90 line-clamp-2">{description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg p-4 flex flex-col justify-end">
              {date && <p className="text-xs text-muted-foreground mb-1">{formatDate(date)}</p>}
              <h3 className="font-semibold text-lg mb-2 relative inline-block">
                <span className="relative z-10">{title}</span>
                <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
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
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-64 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
          {image_url && (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="py-3 flex-1 flex flex-col px-2">
            {date && <p className="text-xs text-muted-foreground mb-1">{formatDate(date)}</p>}
            <h3 className="font-semibold text-sm mb-1 relative inline-block line-clamp-2">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Compact-square variant - Smaller, more condensed (square image)
  if (variant === "compact-square") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-64 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
          {image_url && (
            <div className="aspect-square bg-muted overflow-hidden rounded-lg">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="py-3 flex-1 flex flex-col px-2">
            {date && <p className="text-xs text-muted-foreground mb-1">{formatDate(date)}</p>}
            <h3 className="font-semibold text-sm mb-1 relative inline-block line-clamp-2">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground group-hover:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Featured variant - Larger image with prominent text
  if (variant === "featured") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-96 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col">
          {image_url && (
            <div className="aspect-[4/3] bg-muted overflow-hidden rounded-lg">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
              />
            </div>
          )}
          <div className="py-5 flex-1 flex flex-col px-4">
            {date && <p className="text-sm text-muted-foreground mb-2 font-medium">{formatDate(date)}</p>}
            <h3 className="font-bold text-xl mb-3 relative inline-block">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {description && (
              <p className="text-base text-muted-foreground line-clamp-4 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Minimal variant - Very clean, minimal design
  if (variant === "minimal") {
    return (
      <Link href={`/dev/updates/${slug}`} className={cn("flex-shrink-0 w-80 group", className)}>
        <div className="rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col border border-border">
          {image_url && (
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
            </div>
          )}
          <div className="py-4 flex-1 flex flex-col px-4">
            {date && <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">{formatDate(date)}</p>}
            <h3 className="font-medium text-base mb-3 leading-tight relative inline-block group/title">
              <span className="relative z-10">{title}</span>
              <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground/50 group-hover/title:w-full transition-all duration-300 ease-out"></span>
            </h3>
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return null;
}
