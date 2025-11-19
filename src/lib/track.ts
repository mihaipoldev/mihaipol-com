// Lightweight tracker helpers (no React hooks here so this file stays server-safe)
// Always non-blocking; errors are swallowed.

export type TrackEventType = "page_view" | "link_click" | "section_view" | "session_start";
export type TrackEntityType =
  | "album"
  | "album_link"
  | "site_section"
  | "event"
  | "event_link"
  | "update"
  | "update_link";

// In-memory client-side dedupe within a short window to avoid double-fires on route transitions/StrictMode
const recentlySentEvents: Map<string, number> = new Map();
const DEDUPE_WINDOW_MS = 1000;

export async function trackView(
  eventType: TrackEventType,
  entityType: TrackEntityType,
  entityId: string,
  metadata?: Record<string, unknown>
) {
  // Only attempt dedupe in the browser
  if (typeof window !== "undefined") {
    const key = `${eventType}:${entityType}:${entityId}`;
    const now = Date.now();
    const last = recentlySentEvents.get(key) ?? 0;
    if (now - last < DEDUPE_WINDOW_MS) {
      return;
    }
    recentlySentEvents.set(key, now);
  }

  try {
    const payload = {
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      metadata: metadata ?? null,
    };

    // Prefer sendBeacon if available to avoid blocking navigations
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("/api/track", blob);
      return;
    }

    await fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true, // allow send on page unload
    });
  } catch {
    // noop
  }
}
