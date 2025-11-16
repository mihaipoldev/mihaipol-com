import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

type TrackBody = {
  event_type: "page_view" | "link_click" | "section_view";
  entity_type: "album" | "album_link" | "site_section";
  entity_id: string;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

// Simple in-process dedupe (helps in dev/edge double-invoke scenarios).
// Note: Best-effort only (stateless runtimes may not share memory).
const recentKeys: Map<string, number> = new Map();
const SERVER_DEDUPE_WINDOW_MS = 1000;

// Lightweight bot detection to avoid external dependency
function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  // Common crawlers and preview bots
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

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  // Filter obvious bots/crawlers
  if (!userAgent || isBot(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  let body: TrackBody | null = null;
  try {
    body = (await req.json()) as TrackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body?.event_type || !body?.entity_type || !body?.entity_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Basic first-party session
  const cookies = req.cookies;
  let sessionId = cookies.get("mp_session")?.value || null;
  if (!sessionId) {
    sessionId = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  }

  // Dedupe identical events in a short window per session to avoid double inserts
  const dedupeKey = `${body.event_type}:${body.entity_type}:${body.entity_id}:${sessionId ?? "anon"}`;
  const now = Date.now();
  const last = recentKeys.get(dedupeKey) ?? 0;
  if (now - last < SERVER_DEDUPE_WINDOW_MS) {
    return new NextResponse(null, { status: 204 });
  }
  recentKeys.set(dedupeKey, now);

  const country = req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;
  const referer = req.headers.get("referer") || null;

  const supabase = getServiceSupabaseClient();

  try {
    await supabase.from("analytics_events").insert({
      event_type: body.event_type,
      entity_type: body.entity_type,
      entity_id: body.entity_id,
      session_id: body.session_id ?? sessionId,
      country,
      city,
      user_agent: userAgent,
      referrer: referer,
      metadata: body.metadata ?? null,
    });
  } catch {
    // Intentionally swallow to keep tracking non-blocking
  }

  const res = new NextResponse(null, { status: 204 });
  // Persist session for ~30 days
  if (sessionId && !cookies.get("mp_session")?.value) {
    res.cookies.set("mp_session", sessionId, { path: "/", maxAge: 60 * 60 * 24 * 30, httpOnly: false });
  }
  return res;
}


