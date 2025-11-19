"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LandingAlbum } from "../types";

type LandingAlbumItemProps = {
  album: LandingAlbum;
  fallbackImage: string;
  isCircular?: boolean;
};

export default function LandingAlbumItem({
  album,
  fallbackImage,
  isCircular = false,
}: LandingAlbumItemProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [underlineWidth, setUnderlineWidth] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const albumType = (album.album_type ?? "Single").toUpperCase();
  const formatType = album.format_type ? album.format_type.toUpperCase() : null;
  const releaseInfo = album.release_date
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
        new Date(album.release_date)
      )
    : "Release TBA";

  useEffect(() => {
    const calculateUnderlineWidth = () => {
      if (!titleRef.current) return;

      const element = titleRef.current;
      const textNode = element.firstChild;

      if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
        // Fallback: use element width
        setUnderlineWidth(element.offsetWidth);
        return;
      }

      const text = textNode.textContent || "";
      if (!text.trim()) {
        setUnderlineWidth(0);
        return;
      }

      // Method 1: Try using Range.getClientRects() which should return one rect per line
      // Select the text node directly for more accurate line measurements
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();

      if (rects.length > 0) {
        // Find the widest line
        let maxWidth = 0;
        for (let i = 0; i < rects.length; i++) {
          const width = rects[i].width;
          if (width > maxWidth) {
            maxWidth = width;
          }
        }

        // Always use the Range API result if we got valid measurements
        // For multiple lines, maxWidth is the widest line
        // For single line, maxWidth is that line's width
        if (maxWidth > 0) {
          setUnderlineWidth(maxWidth);
          return;
        }
      }

      // Method 2: Measure by detecting line breaks manually
      // Get the actual width the text wraps to (parent width or element's max-content width)
      const parent = element.parentElement;
      const containerWidth = parent ? parent.offsetWidth : element.offsetWidth;

      // Create a temporary element with same styles to measure
      const tempElement = document.createElement("span");
      const computedStyle = window.getComputedStyle(element);
      tempElement.style.position = "absolute";
      tempElement.style.visibility = "hidden";
      tempElement.style.whiteSpace = "nowrap";
      tempElement.style.font = computedStyle.font;
      tempElement.style.fontSize = computedStyle.fontSize;
      tempElement.style.fontWeight = computedStyle.fontWeight;
      tempElement.style.fontFamily = computedStyle.fontFamily;
      tempElement.style.letterSpacing = computedStyle.letterSpacing;
      tempElement.style.textTransform = computedStyle.textTransform;

      document.body.appendChild(tempElement);

      const words = text.split(" ");
      let maxLineWidth = 0;
      let currentLine = "";

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
        tempElement.textContent = testLine;
        const testWidth = tempElement.offsetWidth;

        // If this line would exceed the container width, measure the previous line
        if (testWidth > containerWidth && currentLine) {
          tempElement.textContent = currentLine;
          const lineWidth = tempElement.offsetWidth;
          if (lineWidth > maxLineWidth) {
            maxLineWidth = lineWidth;
          }
          currentLine = words[i];
        } else {
          currentLine = testLine;
        }
      }

      // Measure the last line
      if (currentLine) {
        tempElement.textContent = currentLine;
        const lineWidth = tempElement.offsetWidth;
        if (lineWidth > maxLineWidth) {
          maxLineWidth = lineWidth;
        }
      }

      document.body.removeChild(tempElement);

      // Use the measured max line width, or fallback to element width if measurement failed
      setUnderlineWidth(maxLineWidth > 0 ? maxLineWidth : element.offsetWidth);
    };

    // Use requestAnimationFrame to ensure layout is complete
    const calculate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(calculateUnderlineWidth);
      });
    };

    // Calculate on mount and when window resizes
    calculate();
    window.addEventListener("resize", calculate);

    // Use ResizeObserver to recalculate when the element size changes
    const resizeObserver = new ResizeObserver(() => {
      calculate();
    });
    if (titleRef.current) {
      resizeObserver.observe(titleRef.current);
    }

    return () => {
      window.removeEventListener("resize", calculate);
      resizeObserver.disconnect();
    };
  }, [album.title]);

  return (
    <div
      className="group transition-all duration-300 hover:-translate-y-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            alt={`${album.title} on ${album.labelName || "Independent"}`}
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
        <h3
          ref={titleRef}
          className="font-bold text-xl relative inline-block pb-1 group-hover:text-foreground transition-all duration-300"
        >
          {album.title}
          {underlineWidth !== null && (
            <span
              className="absolute bottom-0 h-[1px] rounded-full bg-muted-foreground transition-all duration-300"
              style={{
                width: `${underlineWidth}px`,
                left: "50%",
                transform: `translateX(-50%) translateY(${isHovered ? "0" : "0.25rem"})`,
                opacity: isHovered ? 1 : 0,
              }}
            ></span>
          )}
        </h3>
        <p className="text-sm text-muted-foreground">{releaseInfo}</p>
        {formatType && (
          <p className="text-xs text-muted-foreground/70 uppercase tracking-wide">{formatType}</p>
        )}
      </div>
    </div>
  );
}
