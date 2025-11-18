"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import UpdateCard, { type UpdateCardProps, type UpdateCardVariant } from "./UpdateCard";
import { cn } from "@/lib/utils";

type UpdatesCarouselProps = {
  updates: UpdateCardProps[];
  variant?: UpdateCardVariant;
};

export default function UpdatesCarousel({ updates, variant = "default" }: UpdatesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate items per view based on screen size
  useEffect(() => {
    const calculateItemsPerView = () => {
      if (typeof window === "undefined") return;

      const width = window.innerWidth;
      if (width >= 1280) {
        // xl screens: 5 items
        setItemsPerView(5);
      } else if (width >= 1024) {
        // lg screens: 4 items
        setItemsPerView(4);
      } else if (width >= 768) {
        // md screens: 3 items
        setItemsPerView(3);
      } else {
        // sm screens: 2 items (minimum)
        setItemsPerView(2);
      }
    };

    calculateItemsPerView();
    window.addEventListener("resize", calculateItemsPerView);
    return () => window.removeEventListener("resize", calculateItemsPerView);
  }, []);

  const maxIndex = Math.max(0, updates.length - itemsPerView);
  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < maxIndex;

  const scrollPrev = () => {
    if (canScrollPrev) {
      setCurrentIndex((prev) => Math.max(0, prev - itemsPerView));
    }
  };

  const scrollNext = () => {
    if (canScrollNext) {
      setCurrentIndex((prev) => Math.min(maxIndex, prev + itemsPerView));
    }
  };

  // Get card width based on variant
  const getCardWidth = () => {
    switch (variant) {
      case "compact":
        return 256; // w-64 = 256px
      case "featured":
        return 384; // w-96 = 384px
      default:
        return 320; // w-80 = 320px
    }
  };

  // Scroll container to show current batch
  useEffect(() => {
    if (containerRef.current) {
      const cardWidth = getCardWidth();
      const gap = 24; // gap-6 = 24px
      const scrollPosition = currentIndex * (cardWidth + gap);
      containerRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [currentIndex, itemsPerView, variant]);

  if (updates.length === 0) {
    return <p className="text-muted-foreground">No updates yet.</p>;
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide"
        onWheel={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {updates.map((update) => (
          <UpdateCard key={update.id} {...update} variant={variant} className="flex-shrink-0" />
        ))}
      </div>

      {/* Navigation Buttons */}
      {updates.length > itemsPerView && (
        <>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-12 w-12 rounded-full z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300",
              !canScrollPrev && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous updates"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-12 w-12 rounded-full z-10 bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300",
              !canScrollNext && "opacity-50 cursor-not-allowed"
            )}
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next updates"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );
}
