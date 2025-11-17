"use client";

import { useEffect } from "react";
import { trackView, type TrackEntityType, type TrackEventType } from "@/lib/track";

type Props = {
  eventType: TrackEventType;
  entityType: TrackEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
};

export default function TrackView({ eventType, entityType, entityId, metadata }: Props) {
  useEffect(() => {
    if (!entityId) return;
    trackView(eventType, entityType, entityId, {
      path: typeof window !== "undefined" ? window.location.pathname : undefined,
      ...metadata,
    });
    // fire once per entity id
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId]);

  return null;
}
