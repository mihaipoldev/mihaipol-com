"use client";

import React from "react";
import { trackView } from "@/lib/track";

type Props = {
  href: string;
  externalUrl: string; // The actual external URL to open
  label: string;
  rightLabel?: string;
  entityId?: string; // album_link id for analytics
  debug?: Record<string, unknown>;
  className?: string;
};

export default function TrackedLink({ href, externalUrl, label, rightLabel, entityId, debug, className }: Props) {
  const lastClickAtRef = React.useRef<number>(0);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    // Deduplicate rapid double-fires (e.g., dev StrictMode quirks or double clicks)
    const now = Date.now();
    if (now - lastClickAtRef.current < 800) {
      return;
    }
    lastClickAtRef.current = now;

    // eslint-disable-next-line no-console
    console.log("TrackedLink click:", { href, externalUrl, ...debug });
    
    // Track the click
    if (entityId) {
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
      onClick={handleClick}
      target="_blank"
      rel="noopener noreferrer"
      title={`href=${externalUrl}`}
    >
      <span className="text-base font-medium text-gray-900 dark:text-gray-100">{label}</span>
      <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
        {rightLabel || "Open"}
      </span>
    </a>
  );
}


