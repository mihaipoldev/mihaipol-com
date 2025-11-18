import { NextRequest, NextResponse } from "next/server";
import { trackEvent, isBotUA, shouldDedupe } from "@/features/smart-links/analytics/service";

type TrackBody = {
  event_type: "page_view" | "link_click" | "section_view" | "session_start";
  entity_type: "album" | "album_link" | "site_section" | "event" | "event_link" | "update" | "update_link";
  entity_id: string;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function POST(req: NextRequest) {
  const userAgent = req.headers.get("user-agent") || "";
  // Filter obvious bots/crawlers
  if (!userAgent || isBotUA(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }

  let body: TrackBody | null = null;
  try {
    // Handle both JSON and Blob (from sendBeacon)
    // sendBeacon doesn't set Content-Type header, so we need to read as text
    const text = await req.text();
    body = JSON.parse(text) as TrackBody;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Error parsing request body:", error);
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body?.event_type || !body?.entity_type || !body?.entity_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Basic first-party session
  const cookies = req.cookies;
  const existingSessionId = cookies.get("mp_session")?.value || null;
  let sessionId = existingSessionId;
  const isNewSession = !existingSessionId;
  
  if (!sessionId) {
    sessionId = (globalThis as any).crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
  }

  const country = req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;
  const referer = req.headers.get("referer") || null;

  // Track session_start event for new sessions
  if (isNewSession) {
    try {
      const sessionStartDedupeKey = `session_start:site_section:session:${sessionId}`;
      if (!shouldDedupe(sessionStartDedupeKey)) {
        await trackEvent({
          event_type: "session_start",
          entity_type: "site_section",
          entity_id: "session",
          session_id: sessionId,
          country,
          city,
          user_agent: userAgent,
          referrer: referer,
          metadata: null,
        });
      }
    } catch {
      // Intentionally swallow to keep tracking non-blocking
    }
  }

  // Dedupe identical events in a short window per session to avoid double inserts
  const dedupeKey = `${body.event_type}:${body.entity_type}:${body.entity_id}:${sessionId ?? "anon"}`;
  if (shouldDedupe(dedupeKey)) {
    const res = new NextResponse(null, { status: 204 });
    // Persist session for ~30 days if it's a new session
    if (isNewSession && sessionId) {
      res.cookies.set("mp_session", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: false,
      });
    }
    return res;
  }

  try {
    await trackEvent({
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
  } catch (error) {
    // Log error in development to help debug
    if (process.env.NODE_ENV === "development") {
      console.error("Tracking error:", error);
    }
    // Intentionally swallow to keep tracking non-blocking
  }

  const res = new NextResponse(null, { status: 204 });
  // Persist session for ~30 days if it's a new session
  if (isNewSession && sessionId) {
    res.cookies.set("mp_session", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: false,
    });
  }
  return res;
}
