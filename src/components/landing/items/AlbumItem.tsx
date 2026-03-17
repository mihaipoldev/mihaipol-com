"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LandingAlbum } from "../types";

type AlbumItemProps = {
  album: LandingAlbum;
  fallbackImage: string;
};

export default function AlbumItem({
  album,
  fallbackImage,
}: AlbumItemProps) {
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
        setUnderlineWidth(element.offsetWidth);
        return;
      }

      const text = textNode.textContent || "";
      if (!text.trim()) {
        setUnderlineWidth(0);
        return;
      }

      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rects = range.getClientRects();

      if (rects.length > 0) {
        let maxWidth = 0;
        for (let i = 0; i < rects.length; i++) {
          const width = rects[i].width;
          if (width > maxWidth) {
            maxWidth = width;
          }
        }

        if (maxWidth > 0) {
          setUnderlineWidth(maxWidth);
          return;
        }
      }

      const parent = element.parentElement;
      const containerWidth = parent ? parent.offsetWidth : element.offsetWidth;

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

      if (currentLine) {
        tempElement.textContent = currentLine;
        const lineWidth = tempElement.offsetWidth;
        if (lineWidth > maxLineWidth) {
          maxLineWidth = lineWidth;
        }
      }

      document.body.removeChild(tempElement);

      setUnderlineWidth(maxLineWidth > 0 ? maxLineWidth : element.offsetWidth);
    };

    const calculate = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(calculateUnderlineWidth);
      });
    };

    calculate();
    window.addEventListener("resize", calculate);

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
      className="group hover:-translate-y-2 transition-transform duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/albums/${album.slug}`} target="_blank" rel="noopener noreferrer">
        <div
          className={cn(
            "aspect-square overflow-hidden relative mb-4",
            "isolate",
            "rounded-lg"
          )}
        >
          <img
            src={album.cover_image_url ?? fallbackImage}
            alt={`${album.title} on ${album.labelName || "Independent"}`}
            className={cn(
              "w-full h-full object-cover",
              "rounded-lg"
            )}
          />
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center rounded-full bg-background/60 backdrop-blur-sm px-3 py-1 text-xs uppercase tracking-wide text-foreground font-semibold transition-colors duration-300 group-hover:bg-background/100 group-hover:shadow-sm">
              {albumType}
            </span>
          </div>
        </div>
      </Link>
      <div className="text-center space-y-1">
        <h3
          ref={titleRef}
          className="font-bold text-xl relative inline-block pb-1 group-hover:text-foreground transition-colors duration-300"
        >
          {album.title}
          {underlineWidth !== null && (
            <span
              className="absolute bottom-0 h-[1px] rounded-full bg-muted-foreground transition-[opacity,transform] duration-300"
              style={{
                width: `${underlineWidth}px`,
                left: "50%",
                transform: `translateX(-50%) translateY(${isHovered ? "0" : "4px"})`,
                opacity: isHovered ? 1 : 0,
              }}
            />
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
