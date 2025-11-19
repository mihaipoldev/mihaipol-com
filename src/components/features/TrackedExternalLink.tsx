"use client";

import React from "react";
import { trackView } from "@/lib/track";
import type { TrackEventType, TrackEntityType } from "@/lib/track";

type TrackedExternalLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  eventType: TrackEventType;
  entityType: TrackEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
};

const TrackedExternalLink = React.forwardRef<HTMLAnchorElement, TrackedExternalLinkProps>(
  ({ eventType, entityType, entityId, metadata, onClick, href, ...props }, ref) => {
    const lastClickAtRef = React.useRef<number>(0);

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Call the original onClick handler first (for Slot merging)
      onClick?.(e);

      // Deduplicate rapid double-fires
      const now = Date.now();
      if (now - lastClickAtRef.current < 800) {
        if (process.env.NODE_ENV === "development") {
          console.log("TrackedExternalLink: Skipping duplicate click", {
            eventType,
            entityType,
            entityId,
          });
        }
        return;
      }
      lastClickAtRef.current = now;

      // Track the click (non-blocking)
      if (process.env.NODE_ENV === "development") {
        console.log("TrackedExternalLink: Tracking click", {
          eventType,
          entityType,
          entityId,
          href,
        });
      }

      trackView(eventType, entityType, entityId, {
        url: href,
        ...metadata,
      }).catch((error) => {
        if (process.env.NODE_ENV === "development") {
          console.error("TrackedExternalLink: Tracking error", error);
        }
      });

      // Let the default link behavior proceed
    };

    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        {...props}
      />
    );
  }
);

TrackedExternalLink.displayName = "TrackedExternalLink";

export default TrackedExternalLink;
