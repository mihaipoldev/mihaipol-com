"use client";

import React from "react";
import { trackView } from "@/lib/track";
import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";

type Props = {
  href: string;
  externalUrl: string; // The actual external URL to open
  label: string;
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
  label,
  rightLabel,
  entityId,
  debug,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  disableTracking,
}: Props) {
  const { textColor, mutedColor, cardBgColor } = useAlbumColors();
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

  // Calculate button background color (subtle version of card bg)
  const getButtonBgColor = () => {
    const match = cardBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "rgba(0, 0, 0, 0.1)";

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const opacity = match[4] ? parseFloat(match[4]) * 0.5 : 0.5;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
      <span className="text-base font-medium" style={{ color: textColor }}>
        {label}
      </span>
      <span
        className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors"
        style={{
          backgroundColor: getButtonBgColor(),
          color: textColor,
        }}
        onMouseEnter={(e) => {
          const match = cardBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            const opacity = match[4] ? parseFloat(match[4]) * 0.7 : 0.7;
            e.currentTarget.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = getButtonBgColor();
        }}
      >
        {rightLabel || "Open"}
      </span>
    </a>
  );
}
