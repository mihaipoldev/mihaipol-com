"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatUpdateDate } from "../utils";
import type { LandingUpdate } from "../types";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

// Helper function to save scroll position before navigation
const saveScrollPosition = () => {
  if (typeof window !== "undefined") {
    const scrollY = window.scrollY;
    sessionStorage.setItem("updatesPageScrollPosition", scrollY.toString());
    // Set a flag to indicate this is a navigation (not a refresh)
    sessionStorage.setItem("_isNavigation", "true");
  }
};

export type UpdateCardVariant =
  | "default" // Vertical stack: image on top, content below (original)
  | "horizontal" // Image on left, content on right
  | "overlay" // Text overlaid on image with gradient
  | "compact" // Smaller, more condensed (horizontal/rectangular)
  | "compact-square" // Smaller, more condensed (square image)
  | "featured" // Larger image with prominent text
  | "minimal" // Very clean, minimal design
  | "card-badge"; // Original card with badge design

type UpdateItemProps = {
  update: LandingUpdate;
  fallbackImage: string;
  variant?: UpdateCardVariant;
};

export default function UpdateItem({
  update,
  fallbackImage,
  variant = "card-badge",
}: UpdateItemProps) {
  const imageUrl = update.image_url ?? fallbackImage;

  // Card-badge variant - Original design with badge
  if (variant === "card-badge") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Card className={cn(
          "overflow-hidden group bg-card/80 backdrop-blur"
        )}>
        <Link href={`/updates/${update.slug}`} onClick={saveScrollPosition}>
          <div className="aspect-video overflow-hidden relative">
            <img
              src={imageUrl}
              alt={update.title}
              className="w-full h-full object-cover"
            />
            {update.is_featured && (
              <div className="absolute top-2 right-2">
                <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                  <Star className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
            )}
          </div>
        </Link>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">Update</Badge>
            {update.tags && update.tags.length > 0 && update.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <div>
            <h3 className="font-bold text-lg mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.date && (
              <p className="text-xs text-muted-foreground mb-3">{formatUpdateDate(update.date)}</p>
            )}
            {update.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {update.description}
              </p>
            )}
          </div>
        </div>
      </Card>
      </motion.div>
    );
  }

  // Default variant - Vertical stack
  if (variant === "default") {
    return (
      <motion.div
        className="h-full"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link href={`/updates/${update.slug}`} className="group h-full block" onClick={saveScrollPosition}>
          <div className={cn(
            "rounded-lg transition-all duration-200 h-full flex flex-col"
          )}>
            {imageUrl && (
              <div className="aspect-video bg-muted overflow-hidden rounded-lg isolate relative">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                {update.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <div className="py-4 flex-1 flex flex-col bg-transparent px-3">
              {update.tags && update.tags.length > 0 && (
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  {update.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
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
      </motion.div>
    );
  }

  // Horizontal variant - Image on left, content on right
  if (variant === "horizontal") {
    return (
      <Link href={`/updates/${update.slug}`} className="group h-full" onClick={saveScrollPosition}>
        <Card className={cn(
          "overflow-hidden group transition-all duration-300 h-full flex gap-4 p-4"
        )}>
          {imageUrl && (
            <div className="w-32 h-32 flex-shrink-0 bg-muted overflow-hidden rounded-lg relative">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover rounded-lg"
              />
              {update.is_featured && (
                <div className="absolute top-1 right-1">
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs p-0.5">
                    <Star className="w-2.5 h-2.5" />
                  </Badge>
                </div>
              )}
            </div>
          )}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h3 className="font-semibold text-base mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1 block line-clamp-2">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.date && (
              <p className="text-xs text-muted-foreground mb-2">{formatUpdateDate(update.date)}</p>
            )}
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
      <Link href={`/updates/${update.slug}`} className="group h-full" onClick={saveScrollPosition}>
        <div className={cn(
          "rounded-lg overflow-hidden transition-all duration-200 h-full relative"
        )}>
          {imageUrl ? (
            <div className="aspect-video bg-muted overflow-hidden rounded-lg relative">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-lg" />
              {update.is_featured && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="font-semibold text-lg mb-2 relative inline-block transition-all duration-300">
                  <span className="relative pb-1">
                    {update.title}
                    <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-white transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                  </span>
                </h3>
                {update.date && (
                  <p className="text-xs text-white/80 mb-1">{formatUpdateDate(update.date)}</p>
                )}
                {update.description && (
                  <p className="text-sm text-white/90 line-clamp-2">{update.description}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-muted rounded-lg p-4 flex flex-col justify-end">
              <h3 className="font-semibold text-lg mb-2 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
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
      <motion.div
        className="group h-full"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link href={`/updates/${update.slug}`} className="h-full block">
          <div className={cn(
            "rounded-lg transition-all duration-200 h-full flex flex-col"
          )}>
            {imageUrl && (
              <div className="aspect-video bg-muted overflow-hidden rounded-lg isolate relative">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                {update.is_featured && (
                  <div className="absolute top-1 right-2">
                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs p-0.5">
                      <Star className="w-2.5 h-2.5" />
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <div className="py-3 flex-1 flex flex-col px-2">
              <h3 className="font-semibold text-sm mb-1 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1 block line-clamp-2">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              {update.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Compact-square variant - Smaller, more condensed (square image)
  if (variant === "compact-square") {
    return (
      <motion.div
        className="group h-full"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <Link href={`/updates/${update.slug}`} className="h-full block">
          <div className={cn(
            "rounded-lg transition-all duration-200 h-full flex flex-col"
          )}>
            {imageUrl && (
              <div className="aspect-square bg-muted overflow-hidden rounded-lg isolate relative">
                <img
                  src={imageUrl}
                  alt={update.title}
                  className="w-full h-full object-cover rounded-lg"
                />
                {update.is_featured && (
                  <div className="absolute top-1 right-1">
                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/30 text-xs p-0.5">
                      <Star className="w-2.5 h-2.5" />
                    </Badge>
                  </div>
                )}
              </div>
            )}
            <div className="py-3 flex-1 flex flex-col px-2">
              <h3 className="font-semibold text-sm mb-1 relative inline-block group-hover:text-foreground transition-all duration-300">
                <span className="relative pb-1 block line-clamp-2">
                  {update.title}
                  <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
                </span>
              </h3>
              {update.date && (
                <p className="text-xs text-muted-foreground mb-1">
                  {formatUpdateDate(update.date)}
                </p>
              )}
              {update.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{update.description}</p>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  // Featured variant - Larger image with prominent text
  if (variant === "featured") {
    return (
      <Link href={`/updates/${update.slug}`} className="group h-full" onClick={saveScrollPosition}>
        <div className={cn(
          "rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col",
          update.is_featured && "border-2 border-primary/50 shadow-lg"
        )}>
          {imageUrl && (
            <div className="aspect-[4/3] bg-muted overflow-hidden rounded-lg relative">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover rounded-lg"
              />
              {update.is_featured && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
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
      <Link href={`/updates/${update.slug}`} className="group h-full" onClick={saveScrollPosition}>
        <div className={cn(
          "rounded-lg overflow-hidden transition-all duration-200 h-full flex flex-col border border-border"
        )}>
          {imageUrl && (
            <div className="aspect-video bg-muted overflow-hidden relative">
              <img
                src={imageUrl}
                alt={update.title}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
              />
              {update.is_featured && (
                <div className="absolute top-2 right-2">
                  <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>
          )}
          <div className="py-4 flex-1 flex flex-col px-4">
            <h3 className="font-medium text-base mb-3 leading-tight relative inline-block group-hover:text-foreground transition-all duration-300">
              <span className="relative pb-1">
                {update.title}
                <span className="absolute left-0 right-0 -bottom-[0px] h-[1px] rounded-full bg-muted-foreground transition-all duration-300 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"></span>
              </span>
            </h3>
            {update.date && (
              <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">
                {formatUpdateDate(update.date)}
              </p>
            )}
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
