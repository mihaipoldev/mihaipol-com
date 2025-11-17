import { getServiceSupabaseClient } from "@/lib/supabase/server";

export type CountMap = Record<string, number>;

export type AlbumRow = {
  id: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  pageViews: number;
  clicks: number;
  ctr: number;
};

export type PlatformRow = {
  name: string;
  iconUrl: string | null;
  clicks: number;
};

export type CountryRow = {
  country: string;
  count: number;
};

export type DailyPoint = {
  date: string;
  count: number;
};

export type AnalyticsData = {
  totalPageViews: number;
  totalServiceClicks: number;
  visitsSeries: DailyPoint[];
  clicksSeries: DailyPoint[];
  perAlbumRows: AlbumRow[];
  perPlatformRows: PlatformRow[];
  topCountries: CountryRow[];
};

const MAX_ROWS = 5000;

function toDayKey(d: string): string {
  const date = new Date(d);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const supabase = getServiceSupabaseClient();

  // Fetch base reference data
  const [{ data: albums = [] }, { data: platforms = [] }] = await Promise.all([
    supabase.from("albums").select("id, title, slug, cover_image_url"),
    supabase.from("platforms").select("id, name, icon_url"),
  ]);

  // Totals with lightweight head requests
  const [albumViewsHead, sectionViewsHead, linkClicksHead] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .eq("entity_type", "album"),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "section_view")
      .eq("entity_type", "site_section"),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "link_click"),
  ]);

  const totalPageViews = (albumViewsHead.count || 0) + (sectionViewsHead.count || 0);
  const totalServiceClicks = linkClicksHead.count || 0;

  // For grouped stats, fetch a capped set and reduce in memory (MVP).
  const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [{ data: albumPageViews = [] }, { data: linkClicks = [] }, { data: eventsForGeo = [] }, { data: recentEvents = [] }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("entity_id")
      .eq("event_type", "page_view")
      .eq("entity_type", "album")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("entity_id, metadata")
      .eq("event_type", "link_click")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("country")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("created_at, event_type, entity_type")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true })
      .range(0, MAX_ROWS - 1),
  ]);

  // Ensure non-null arrays for type safety
  const albumsSafe = (albums ?? []) as any[];
  const platformsSafe = (platforms ?? []) as any[];
  const albumPageViewsSafe = (albumPageViews ?? []) as any[];
  const linkClicksSafe = (linkClicks ?? []) as any[];
  const eventsForGeoSafe = (eventsForGeo ?? []) as any[];

  // Build maps
  const viewsByAlbumId: CountMap = albumPageViewsSafe.reduce((acc: CountMap, row: any) => {
    acc[row.entity_id] = (acc[row.entity_id] || 0) + 1;
    return acc;
  }, {});

  // We need to map album_link -> album_id & platform
  const { data: albumLinks = [] } = await supabase.from("album_links").select("id, album_id, platform_id");
  const albumIdByLinkId = new Map<string, string>();
  const platformIdByLinkId = new Map<string, string | null>();
  for (const l of albumLinks as any[]) {
    albumIdByLinkId.set(l.id, l.album_id);
    platformIdByLinkId.set(l.id, l.platform_id);
  }

  const clicksByAlbumId: CountMap = {};
  const clicksByPlatformId: CountMap = {};
  for (const ev of linkClicksSafe as any[]) {
    const linkId = ev.entity_id as string;
    const albumId = albumIdByLinkId.get(linkId);
    const platformId = platformIdByLinkId.get(linkId);
    if (albumId) clicksByAlbumId[albumId] = (clicksByAlbumId[albumId] || 0) + 1;
    if (platformId) clicksByPlatformId[platformId] = (clicksByPlatformId[platformId] || 0) + 1;
  }

  const topCountries: CountryRow[] = [];
  const countryMap: CountMap = {};
  for (const ev of eventsForGeoSafe as any[]) {
    const c = ev.country || "Unknown";
    countryMap[c] = (countryMap[c] || 0) + 1;
  }
  for (const [country, count] of Object.entries(countryMap)) {
    topCountries.push({ country, count });
  }
  topCountries.sort((a, b) => b.count - a.count);

  // Build daily series (last 30 days) for page visits and service clicks
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const startTs = dayStart.getTime() - 29 * 24 * 60 * 60 * 1000;
  const dayKeys: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(startTs + i * 24 * 60 * 60 * 1000);
    dayKeys.push(toDayKey(d.toISOString()));
  }
  const visitsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const clicksByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  for (const ev of (recentEvents as any[])) {
    const key = toDayKey(ev.created_at);
    if (!(key in visitsByDay)) continue;
    if (ev.event_type === "page_view" || (ev.event_type === "section_view" && ev.entity_type === "site_section")) {
      visitsByDay[key] += 1;
    } else if (ev.event_type === "link_click") {
      clicksByDay[key] += 1;
    }
  }
  const visitsSeries = dayKeys.map((k) => ({ date: k, count: visitsByDay[k] || 0 }));
  const clicksSeries = dayKeys.map((k) => ({ date: k, count: clicksByDay[k] || 0 }));

  // Build per-album rows
  const perAlbumRows = albumsSafe.map((a: any) => {
    const pv = viewsByAlbumId[a.id] || 0;
    const cl = clicksByAlbumId[a.id] || 0;
    const ctr = pv > 0 ? (cl / pv) * 100 : 0;
    return { id: a.id, title: a.title, slug: a.slug, coverImageUrl: a.cover_image_url, pageViews: pv, clicks: cl, ctr };
  }).filter(row => row.pageViews > 0 || row.clicks > 0)
    .sort((a, b) => b.pageViews - a.pageViews);

  // Build per-platform rows
  const perPlatformRows = platformsSafe
    .map((p: any) => ({ name: p.name, iconUrl: p.icon_url, clicks: clicksByPlatformId[p.id] || 0 }))
    .filter((r) => r.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);

  return {
    totalPageViews,
    totalServiceClicks,
    visitsSeries,
    clicksSeries,
    perAlbumRows,
    perPlatformRows,
    topCountries,
  };
}

