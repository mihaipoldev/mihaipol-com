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

// Limit to last 90 days for analytics queries to improve performance
const ANALYTICS_LOOKBACK_DAYS = 90;
const MAX_ANALYTICS_ROWS = 10000; // Increased but with date filtering

function toDayKey(d: string): string {
  const date = new Date(d);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export async function getAnalyticsData(): Promise<AnalyticsData> {
  const startTime = performance.now();
  const supabase = getServiceSupabaseClient();

  // Calculate date boundaries for filtering
  const now = new Date();
  const lookbackDate = new Date(now.getTime() - ANALYTICS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const lookbackISO = lookbackDate.toISOString();
  
  // For daily series, we only need last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  console.log("[Analytics] Starting data fetch...");
  console.log(`[Analytics] Date range: ${lookbackISO} to ${now.toISOString()}`);

  // Fetch base reference data and album links in parallel
  const refDataStart = performance.now();
  const [
    { data: albums = [] },
    { data: platforms = [] },
    { data: albumLinks = [] },
  ] = await Promise.all([
    supabase.from("albums").select("id, title, slug, cover_image_url"),
    supabase.from("platforms").select("id, name, icon_url"),
    supabase.from("album_links").select("id, album_id, platform_id"),
  ]);
  const refDataTime = performance.now() - refDataStart;
  console.log(`[Analytics] Reference data fetch: ${refDataTime.toFixed(2)}ms (albums: ${albums?.length || 0}, platforms: ${platforms?.length || 0}, links: ${albumLinks?.length || 0})`);

  // Build album_link lookup maps early
  const albumIdByLinkId = new Map<string, string>();
  const platformIdByLinkId = new Map<string, string | null>();
  for (const l of (albumLinks ?? []) as any[]) {
    albumIdByLinkId.set(l.id, l.album_id);
    platformIdByLinkId.set(l.id, l.platform_id);
  }

  // Totals with lightweight head requests (no date filter needed for totals)
  const totalsStart = performance.now();
  const [pageViewsHead, linkClicksHead] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view"),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "link_click"),
  ]);
  const totalsTime = performance.now() - totalsStart;
  const totalPageViews = pageViewsHead.count || 0;
  const totalServiceClicks = linkClicksHead.count || 0;
  console.log(`[Analytics] Totals fetch: ${totalsTime.toFixed(2)}ms (page views: ${totalPageViews}, clicks: ${totalServiceClicks})`);

  // Optimized queries with date filtering and better selectivity
  // Only fetch data from the last 90 days to reduce data transfer
  const analyticsQueriesStart = performance.now();
  const [
    { data: albumPageViews = [] },
    { data: linkClicks = [] },
    { data: eventsForGeo = [] },
    { data: recentEvents = [] },
  ] = await Promise.all([
    // Album page views - only last 90 days, filtered by type
    supabase
      .from("analytics_events")
      .select("entity_id")
      .eq("event_type", "page_view")
      .eq("entity_type", "album")
      .gte("created_at", lookbackISO)
      .order("created_at", { ascending: false })
      .limit(MAX_ANALYTICS_ROWS),
    // Link clicks - only last 90 days
    supabase
      .from("analytics_events")
      .select("entity_id, entity_type, metadata")
      .eq("event_type", "link_click")
      .gte("created_at", lookbackISO)
      .order("created_at", { ascending: false })
      .limit(MAX_ANALYTICS_ROWS),
    // Geo data - only last 90 days, only where country is not null
    supabase
      .from("analytics_events")
      .select("country")
      .not("country", "is", null)
      .gte("created_at", lookbackISO)
      .order("created_at", { ascending: false })
      .limit(MAX_ANALYTICS_ROWS),
    // Daily series data - only last 30 days, only page_view and link_click
    supabase
      .from("analytics_events")
      .select("created_at, event_type")
      .gte("created_at", thirtyDaysAgoISO)
      .in("event_type", ["page_view", "link_click"])
      .order("created_at", { ascending: true })
      .limit(MAX_ANALYTICS_ROWS),
  ]);
  const analyticsQueriesTime = performance.now() - analyticsQueriesStart;
  console.log(`[Analytics] Analytics queries: ${analyticsQueriesTime.toFixed(2)}ms`);
  console.log(`[Analytics]   - Album page views: ${albumPageViews?.length || 0} rows`);
  console.log(`[Analytics]   - Link clicks: ${linkClicks?.length || 0} rows`);
  console.log(`[Analytics]   - Geo events: ${eventsForGeo?.length || 0} rows`);
  console.log(`[Analytics]   - Recent events (30d): ${recentEvents?.length || 0} rows`);

  // Ensure non-null arrays for type safety
  const processingStart = performance.now();
  const albumsSafe = (albums ?? []) as any[];
  const platformsSafe = (platforms ?? []) as any[];
  const albumPageViewsSafe = (albumPageViews ?? []) as any[];
  const linkClicksSafe = (linkClicks ?? []) as any[];
  const eventsForGeoSafe = (eventsForGeo ?? []) as any[];

  // Build maps efficiently
  const mapBuildingStart = performance.now();
  const viewsByAlbumId: CountMap = albumPageViewsSafe.reduce((acc: CountMap, row: any) => {
    acc[row.entity_id] = (acc[row.entity_id] || 0) + 1;
    return acc;
  }, {});

  const clicksByAlbumId: CountMap = {};
  const clicksByPlatformId: CountMap = {};
  let albumLinkClicksCount = 0;
  let unmappedAlbumLinkClicks = 0;
  const unmappedLinkIds = new Set<string>();
  
  for (const ev of linkClicksSafe as any[]) {
    const entityType = ev.entity_type as string;
    const entityId = ev.entity_id as string;
    
    // Handle album_link clicks (existing logic)
    if (entityType === "album_link") {
      albumLinkClicksCount++;
      const albumId = albumIdByLinkId.get(entityId);
      const platformId = platformIdByLinkId.get(entityId);
      if (albumId) {
        clicksByAlbumId[albumId] = (clicksByAlbumId[albumId] || 0) + 1;
      } else {
        unmappedAlbumLinkClicks++;
        unmappedLinkIds.add(entityId);
      }
      if (platformId) {
        clicksByPlatformId[platformId] = (clicksByPlatformId[platformId] || 0) + 1;
      }
    }
    // Note: event_link and update_link clicks are tracked but not aggregated into album/platform stats
    // They could be added to separate stats if needed in the future
  }
  const mapBuildingTime = performance.now() - mapBuildingStart;
  console.log(`[Analytics] Map building: ${mapBuildingTime.toFixed(2)}ms`);
  console.log(`[Analytics]   - Unique albums with views: ${Object.keys(viewsByAlbumId).length}`);
  console.log(`[Analytics]   - Unique albums with clicks: ${Object.keys(clicksByAlbumId).length}`);
  console.log(`[Analytics]   - Unique platforms with clicks: ${Object.keys(clicksByPlatformId).length}`);
  console.log(`[Analytics]   - Album link clicks: ${albumLinkClicksCount} (mapped: ${albumLinkClicksCount - unmappedAlbumLinkClicks}, unmapped: ${unmappedAlbumLinkClicks})`);
  if (unmappedAlbumLinkClicks > 0) {
    console.log(`[Analytics]   - Unmapped link IDs (sample): ${Array.from(unmappedLinkIds).slice(0, 5).join(", ")}`);
    console.log(`[Analytics]   - Note: Unmapped clicks may be from deleted album_links or links outside the 90-day window`);
  }

  // Build country stats
  const countryMap: CountMap = {};
  for (const ev of eventsForGeoSafe as any[]) {
    const c = ev.country || "Unknown";
    countryMap[c] = (countryMap[c] || 0) + 1;
  }
  const topCountries: CountryRow[] = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  // Build daily series (last 30 days) for page visits and service clicks
  const seriesStart = performance.now();
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
  for (const ev of (recentEvents ?? []) as any[]) {
    const key = toDayKey(ev.created_at);
    if (!(key in visitsByDay)) continue;
    if (ev.event_type === "page_view") {
      visitsByDay[key] += 1;
    } else if (ev.event_type === "link_click") {
      clicksByDay[key] += 1;
    }
  }
  const visitsSeries = dayKeys.map((k) => ({ date: k, count: visitsByDay[k] || 0 }));
  const clicksSeries = dayKeys.map((k) => ({ date: k, count: clicksByDay[k] || 0 }));
  const seriesTime = performance.now() - seriesStart;
  console.log(`[Analytics] Daily series building: ${seriesTime.toFixed(2)}ms`);

  // Build per-album rows
  const rowsStart = performance.now();
  const perAlbumRows = albumsSafe
    .map((a: any) => {
      const pv = viewsByAlbumId[a.id] || 0;
      const cl = clicksByAlbumId[a.id] || 0;
      const ctr = pv > 0 ? (cl / pv) * 100 : 0;
      return {
        id: a.id,
        title: a.title,
        slug: a.slug,
        coverImageUrl: a.cover_image_url,
        pageViews: pv,
        clicks: cl,
        ctr,
      };
    })
    .filter((row) => row.pageViews > 0 || row.clicks > 0)
    .sort((a, b) => b.pageViews - a.pageViews);

  // Build per-platform rows
  const perPlatformRows = platformsSafe
    .map((p: any) => ({ name: p.name, iconUrl: p.icon_url, clicks: clicksByPlatformId[p.id] || 0 }))
    .filter((r) => r.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);
  const rowsTime = performance.now() - rowsStart;
  console.log(`[Analytics] Row building: ${rowsTime.toFixed(2)}ms (albums: ${perAlbumRows.length}, platforms: ${perPlatformRows.length}, countries: ${topCountries.length})`);

  const processingTime = performance.now() - processingStart;
  const totalTime = performance.now() - startTime;
  
  console.log(`[Analytics] Data processing: ${processingTime.toFixed(2)}ms`);
  console.log(`[Analytics] ========================================`);
  console.log(`[Analytics] TOTAL TIME: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`);
  console.log(`[Analytics] ========================================`);

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
