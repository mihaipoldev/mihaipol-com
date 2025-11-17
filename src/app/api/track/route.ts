import { NextRequest, NextResponse } from "next/server";
import { trackEvent, isBotUA, shouldDedupe } from "@/features/smart-links/analytics/service";

type TrackBody = {
  event_type: "page_view" | "link_click" | "section_view";
  entity_type: "album" | "album_link" | "site_section";
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
  if (shouldDedupe(dedupeKey)) {
    return new NextResponse(null, { status: 204 });
  }

  const country = req.headers.get("x-vercel-ip-country") || null;
  const city = req.headers.get("x-vercel-ip-city") || null;
  const referer = req.headers.get("referer") || null;

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


