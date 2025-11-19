import { getServiceSupabaseClient } from "@/lib/supabase/server";

export type TrackEventInput = {
  event_type: "page_view" | "link_click" | "section_view" | "session_start";
  entity_type:
    | "album"
    | "album_link"
    | "site_section"
    | "event"
    | "event_link"
    | "update"
    | "update_link";
  entity_id: string;
  session_id?: string | null;
  user_agent?: string | null;
  country?: string | null;
  city?: string | null;
  referrer?: string | null;
  metadata?: Record<string, unknown> | null;
};

const recentKeys: Map<string, number> = new Map();
const SERVER_DEDUPE_WINDOW_MS = 1000;

export function isBotUA(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  const patterns = [
    "bot",
    "spider",
    "crawler",
    "crawl",
    "preview",
    "facebookexternalhit",
    "whatsapp",
    "telegrambot",
    "slackbot",
    "discordbot",
    "twitterbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "pinterestbot",
    "bitlybot",
    "vkshare",
    "skypeuripreview",
    "yandex",
    "baiduspider",
    "duckduckbot",
    "bingbot",
    "googlebot",
    "applebot",
    "ahrefsbot",
    "semrushbot",
  ];
  return patterns.some((p) => ua.includes(p));
}

export function shouldDedupe(key: string): boolean {
  const now = Date.now();
  const last = recentKeys.get(key) ?? 0;
  if (now - last < SERVER_DEDUPE_WINDOW_MS) {
    return true;
  }
  recentKeys.set(key, now);
  return false;
}

export async function trackEvent(input: TrackEventInput) {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from("analytics_events").insert({
    event_type: input.event_type,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    session_id: input.session_id ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    user_agent: input.user_agent ?? null,
    referrer: input.referrer ?? null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    // Log error in development to help debug
    if (process.env.NODE_ENV === "development") {
      console.error("Database insert error:", error);
    }
    throw error;
  }
}
