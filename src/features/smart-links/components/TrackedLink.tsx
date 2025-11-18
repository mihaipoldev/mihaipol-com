"use client";

import React from "react";
import { trackView } from "@/lib/track";
import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";

type Props = {
  href: string;
  externalUrl: string; // The actual external URL to open
  horizontalIconUrl?: string | null;
  rightLabel?: string;
  entityId?: string; // album_link id for analytics
  debug?: Record<string, unknown>;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  disableTracking?: boolean; // If true, skip tracking
};

export default function TrackedLink({
  href,
  externalUrl,
  horizontalIconUrl,
  rightLabel,
  entityId,
  debug,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  disableTracking,
}: Props) {
  const { linkButtonBgColor, linkHoverBgColor, linkTextColor } = useAlbumColors();
  const lastClickAtRef = React.useRef<number>(0);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Deduplicate rapid double-fires (e.g., dev StrictMode quirks or double clicks)
    const now = Date.now();
    if (now - lastClickAtRef.current < 800) {
      return;
    }
    lastClickAtRef.current = now;

    console.log("TrackedLink click:", { href, externalUrl, ...debug });

    // Track the click (unless tracking is disabled)
    if (!disableTracking && entityId) {
      trackView("link_click", "album_link", entityId, {
        href,
        externalUrl,
        ...(debug || {}),
      }).catch(() => void 0);
    }

    // Open external URL in new tab
    window.open(externalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <a
      href={externalUrl}
      className={className}
      style={style}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      target="_blank"
      rel="noopener noreferrer"
      title={`href=${externalUrl}`}
    >
      {horizontalIconUrl && (
        <div className="h-8 flex items-center">
          <img 
            src={horizontalIconUrl} 
            alt=""
            className="h-9 w-auto object-contain"
          />
        </div>
      )}
      <span
        className="rounded-full px-3 py-2 text-base font-medium transition-all duration-200 "
        style={{
          backgroundColor: "transparent",
          color: linkTextColor,
          border: 'none',
        }}
      >
        {rightLabel || "Open"}
      </span>
    </a>
  );
}
