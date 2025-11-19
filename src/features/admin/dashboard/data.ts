import { getServiceSupabaseClient } from "@/lib/supabase/server";

export type DailyPoint = {
  date: string;
  count: number;
};

export type AlbumsStats = {
  total: number;
  upcoming: number;
  past12Months: number;
  byType: Record<string, number>;
};

export type EventsStats = {
  past: number;
  upcoming: number;
};

export type UpdatesStats = {
  total: number;
  byStatus: Record<string, number>;
};

export type SectionClicksData = {
  albums: DailyPoint[];
  updates: DailyPoint[];
  events: DailyPoint[];
};

export type WebsiteVisitsData = {
  total: number;
  series: DailyPoint[];
};

export type SectionItemVisitsData = {
  total: number;
  albums: DailyPoint[];
  events: DailyPoint[];
  updates: DailyPoint[];
};

export type TopPerformingPage = {
  id: string;
  title: string;
  slug: string;
  type: "album" | "event" | "update";
  pageViews: number;
  clicks: number;
  imageUrl: string | null;
};

export type DashboardData = {
  albums: AlbumsStats;
  events: EventsStats;
  updates: UpdatesStats;
  websiteVisits: WebsiteVisitsData;
  sectionItemVisits: SectionItemVisitsData;
  sectionClicks: SectionClicksData;
  topPerformingPages: TopPerformingPage[];
};

function toDayKey(d: string): string {
  const date = new Date(d);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function toWeekKey(d: string): string {
  const date = new Date(d);
  const year = date.getUTCFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function toMonthKey(d: string): string {
  const date = new Date(d);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export async function getDashboardData(scope: string = "30"): Promise<DashboardData> {
  const startTime = performance.now();
  const supabase = getServiceSupabaseClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  // Calculate lookback date based on scope
  let lookbackDate: Date;
  if (scope === "all") {
    // Use a very old date for "all"
    lookbackDate = new Date(0);
  } else {
    const days = parseInt(scope, 10);
    lookbackDate = new Date(today);
    lookbackDate.setDate(lookbackDate.getDate() - days);
  }
  const lookbackISO = lookbackDate.toISOString();

  // Calculate 12 months ago (for albums stats, not affected by scope)
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twelveMonthsAgoISO = twelveMonthsAgo.toISOString().split("T")[0];

  console.log(
    `[Dashboard] Starting data fetch with scope: ${scope} days (lookback: ${lookbackISO})...`
  );

  // Fetch albums stats
  const albumsStatsStart = performance.now();
  const [
    { count: totalAlbums },
    { count: upcomingAlbums },
    { count: past12MonthsAlbums },
    { data: albumsByType },
  ] = await Promise.all([
    supabase.from("albums").select("*", { count: "exact", head: true }),
    supabase
      .from("albums")
      .select("*", { count: "exact", head: true })
      .gt("release_date", todayISO),
    supabase
      .from("albums")
      .select("*", { count: "exact", head: true })
      .gte("release_date", twelveMonthsAgoISO)
      .lt("release_date", todayISO),
    supabase.from("albums").select("album_type"),
  ]);
  const albumsStatsTime = performance.now() - albumsStatsStart;
  console.log(`[Dashboard] Albums stats: ${albumsStatsTime.toFixed(2)}ms`);

  // Calculate albums by type
  const albumsByTypeMap: Record<string, number> = {};
  if (albumsByType) {
    for (const album of albumsByType) {
      const type = album.album_type || "Unknown";
      albumsByTypeMap[type] = (albumsByTypeMap[type] || 0) + 1;
    }
  }

  const albumsStats: AlbumsStats = {
    total: totalAlbums || 0,
    upcoming: upcomingAlbums || 0,
    past12Months: past12MonthsAlbums || 0,
    byType: albumsByTypeMap,
  };

  // Fetch events stats
  const eventsStatsStart = performance.now();
  const [{ count: pastEvents }, { count: upcomingEvents }] = await Promise.all([
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .or(`event_status.eq.past,date.lt.${todayISO}`),
    supabase
      .from("events")
      .select("*", { count: "exact", head: true })
      .eq("event_status", "upcoming")
      .gte("date", todayISO),
  ]);
  const eventsStatsTime = performance.now() - eventsStatsStart;
  console.log(`[Dashboard] Events stats: ${eventsStatsTime.toFixed(2)}ms`);

  const eventsStats: EventsStats = {
    past: pastEvents || 0,
    upcoming: upcomingEvents || 0,
  };

  // Fetch updates stats
  const updatesStatsStart = performance.now();
  const [{ count: totalUpdates }, { data: updatesByStatus }] = await Promise.all([
    supabase.from("updates").select("*", { count: "exact", head: true }),
    supabase.from("updates").select("publish_status"),
  ]);
  const updatesStatsTime = performance.now() - updatesStatsStart;
  console.log(`[Dashboard] Updates stats: ${updatesStatsTime.toFixed(2)}ms`);

  // Calculate updates by status
  const updatesByStatusMap: Record<string, number> = {};
  if (updatesByStatus) {
    for (const update of updatesByStatus) {
      const status = update.publish_status || "Unknown";
      updatesByStatusMap[status] = (updatesByStatusMap[status] || 0) + 1;
    }
  }

  const updatesStats: UpdatesStats = {
    total: totalUpdates || 0,
    byStatus: updatesByStatusMap,
  };

  // OPTIMIZED: Fetch all analytics events we need in fewer queries, then distribute in memory
  // Use scope-based lookback for analytics queries
  // For daily series, use the full scope
  let seriesDays: number;

  if (scope === "all") {
    // For "all", show last 365 days (1 year) for reasonable performance
    seriesDays = 365;
  } else {
    seriesDays = parseInt(scope, 10);
  }

  // Calculate lookback for series (use full scope)
  const seriesLookbackDate = new Date(today.getTime() - seriesDays * 24 * 60 * 60 * 1000);
  const sinceISO = seriesLookbackDate.toISOString();

  // Prepare day keys for series
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const startTs = dayStart.getTime() - (seriesDays - 1) * 24 * 60 * 60 * 1000;
  const dayKeys: string[] = [];
  for (let i = 0; i < seriesDays; i++) {
    const d = new Date(startTs + i * 24 * 60 * 60 * 1000);
    dayKeys.push(toDayKey(d.toISOString()));
  }

  const analyticsQueriesStart = performance.now();
  // Fetch all analytics events we need in parallel - filtered by scope
  const [
    { data: recentEventsRaw }, // All events for daily series (session_start, page_view, section_view)
    { data: topPagesEventsRaw }, // Page views and link clicks for top pages (filtered by scope)
    { count: totalSessionStarts }, // Total count for website visits (filtered by scope)
    { count: totalItemViews }, // Total count for item views (filtered by scope)
  ] = await Promise.all([
    // Single query for daily series analytics: session_start, page_view (items), section_view
    supabase
      .from("analytics_events")
      .select("created_at, event_type, entity_type, entity_id")
      .gte("created_at", sinceISO)
      .in("event_type", ["session_start", "page_view", "section_view"])
      .order("created_at", { ascending: true }),
    // Single query for top pages data: page_view and link_click (using scope-based lookback)
    supabase
      .from("analytics_events")
      .select("created_at, event_type, entity_type, entity_id")
      .gte("created_at", lookbackISO)
      .in("event_type", ["page_view", "link_click"])
      .order("created_at", { ascending: false })
      .limit(10000),
    // Total counts filtered by scope (these might be slow but run in parallel)
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "session_start")
      .gte("created_at", lookbackISO),
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .in("entity_type", ["album", "event", "update"])
      .gte("created_at", lookbackISO),
  ]);

  // Ensure arrays are never null
  const recentEvents = recentEventsRaw ?? [];
  const topPagesEvents = topPagesEventsRaw ?? [];

  const analyticsQueriesTime = performance.now() - analyticsQueriesStart;
  console.log(`[Dashboard] Analytics queries (consolidated): ${analyticsQueriesTime.toFixed(2)}ms`);
  console.log(`[Dashboard]   - Daily series events: ${recentEvents.length} rows`);
  console.log(`[Dashboard]   - Top pages events: ${topPagesEvents.length} rows`);

  // Process events in memory
  const processingStart = performance.now();

  // Separate events by type
  const sessionStarts = recentEvents.filter((e: any) => e.event_type === "session_start");
  const itemPageViews = recentEvents.filter(
    (e: any) => e.event_type === "page_view" && ["album", "event", "update"].includes(e.entity_type)
  );
  const sectionViews = recentEvents.filter(
    (e: any) => e.event_type === "section_view" && e.entity_type === "site_section"
  );

  // Build website visits series
  const visitsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  for (const ev of sessionStarts) {
    const key = toDayKey(ev.created_at);
    if (key in visitsByDay) {
      visitsByDay[key] += 1;
    }
  }
  const websiteVisitsSeries = dayKeys.map((k) => ({ date: k, count: visitsByDay[k] || 0 }));

  // Build section item visits series
  const albumsItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );
  const eventsItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );
  const updatesItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );

  for (const ev of itemPageViews) {
    const key = toDayKey(ev.created_at);
    if (!(key in albumsItemVisitsByDay)) continue;
    const entityType = ev.entity_type as string;
    if (entityType === "album") {
      albumsItemVisitsByDay[key] += 1;
    } else if (entityType === "event") {
      eventsItemVisitsByDay[key] += 1;
    } else if (entityType === "update") {
      updatesItemVisitsByDay[key] += 1;
    }
  }

  // Build section clicks series
  const albumsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const updatesByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const eventsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));

  for (const ev of sectionViews) {
    const key = toDayKey(ev.created_at);
    if (!(key in albumsByDay)) continue;
    const entityId = ev.entity_id as string;
    if (entityId === "albums") {
      albumsByDay[key] += 1;
    } else if (entityId === "updates") {
      updatesByDay[key] += 1;
    } else if (entityId === "events") {
      eventsByDay[key] += 1;
    }
  }

  const processingTime = performance.now() - processingStart;
  console.log(`[Dashboard] Daily series data processing: ${processingTime.toFixed(2)}ms`);

  const websiteVisits: WebsiteVisitsData = {
    total: totalSessionStarts || 0,
    series: websiteVisitsSeries,
  };

  const sectionItemVisits: SectionItemVisitsData = {
    total: totalItemViews || 0,
    albums: dayKeys.map((k) => ({ date: k, count: albumsItemVisitsByDay[k] || 0 })),
    events: dayKeys.map((k) => ({ date: k, count: eventsItemVisitsByDay[k] || 0 })),
    updates: dayKeys.map((k) => ({ date: k, count: updatesItemVisitsByDay[k] || 0 })),
  };

  const sectionClicks: SectionClicksData = {
    albums: dayKeys.map((k) => ({ date: k, count: albumsByDay[k] || 0 })),
    updates: dayKeys.map((k) => ({ date: k, count: updatesByDay[k] || 0 })),
    events: dayKeys.map((k) => ({ date: k, count: eventsByDay[k] || 0 })),
  };

  // Process top pages events in memory (already fetched above)
  const topPagesStart = performance.now();

  // Separate events by type
  const albumPageViews = topPagesEvents.filter(
    (e: any) => e.event_type === "page_view" && e.entity_type === "album"
  );
  const eventPageViews = topPagesEvents.filter(
    (e: any) => e.event_type === "page_view" && e.entity_type === "event"
  );
  const updatePageViews = topPagesEvents.filter(
    (e: any) => e.event_type === "page_view" && e.entity_type === "update"
  );
  const linkClicks = topPagesEvents.filter((e: any) => e.event_type === "link_click");

  console.log(
    `[Dashboard] Top pages processing: ${(performance.now() - topPagesStart).toFixed(2)}ms`
  );
  console.log(`[Dashboard]   - Album page views: ${albumPageViews.length} rows`);
  console.log(`[Dashboard]   - Event page views: ${eventPageViews.length} rows`);
  console.log(`[Dashboard]   - Update page views: ${updatePageViews.length} rows`);
  console.log(`[Dashboard]   - Link clicks: ${linkClicks.length} rows`);

  // Count page views by entity ID
  const viewsByAlbumId: Record<string, number> = {};
  const viewsByEventId: Record<string, number> = {};
  const viewsByUpdateId: Record<string, number> = {};

  albumPageViews.forEach((ev: any) => {
    viewsByAlbumId[ev.entity_id] = (viewsByAlbumId[ev.entity_id] || 0) + 1;
  });
  eventPageViews.forEach((ev: any) => {
    viewsByEventId[ev.entity_id] = (viewsByEventId[ev.entity_id] || 0) + 1;
  });
  updatePageViews.forEach((ev: any) => {
    viewsByUpdateId[ev.entity_id] = (viewsByUpdateId[ev.entity_id] || 0) + 1;
  });

  // Map link clicks to albums via album_links
  const { data: albumLinks = [] } = await supabase.from("album_links").select("id, album_id");
  const albumIdByLinkId = new Map<string, string>();
  for (const l of albumLinks as any[]) {
    albumIdByLinkId.set(String(l.id), String(l.album_id));
  }

  // Debug: Log album link mapping
  if (process.env.NODE_ENV === "development") {
    const albumLinkClicks = (linkClicks || []).filter((ev: any) => ev.entity_type === "album_link");
    const albumLinksArray = albumLinks || [];
    console.log("[Dashboard] Album link clicks count:", albumLinkClicks.length);
    console.log("[Dashboard] Album links in DB:", albumLinksArray.length);
    if (albumLinkClicks.length > 0 && albumLinksArray.length > 0) {
      const sampleClick = albumLinkClicks[0];
      console.log("[Dashboard] Sample album link click entity_id:", sampleClick.entity_id);
      console.log("[Dashboard] Sample album link ID from DB:", albumLinksArray[0]?.id);
      console.log(
        "[Dashboard] Mapping result:",
        albumIdByLinkId.get(String(sampleClick.entity_id))
      );
      console.log(
        "[Dashboard] All album link IDs in map:",
        Array.from(albumIdByLinkId.keys()).slice(0, 5)
      );
    }
  }

  // Count clicks by entity ID
  // For album_link: entity_id is the album_link ID, need to map to album_id
  // For event_link: entity_id is directly the event ID
  // For update_link: entity_id is directly the update ID
  const clicksByAlbumId: Record<string, number> = {};
  const clicksByEventId: Record<string, number> = {};
  const clicksByUpdateId: Record<string, number> = {};

  (linkClicks || []).forEach((ev: any) => {
    if (ev.entity_type === "album_link") {
      const albumId = albumIdByLinkId.get(String(ev.entity_id));
      if (albumId) {
        clicksByAlbumId[albumId] = (clicksByAlbumId[albumId] || 0) + 1;
      } else if (process.env.NODE_ENV === "development") {
        console.log("[Dashboard] Failed to map album_link click:", ev.entity_id);
      }
    } else if (ev.entity_type === "event_link") {
      // entity_id is directly the event ID
      clicksByEventId[ev.entity_id] = (clicksByEventId[ev.entity_id] || 0) + 1;
    } else if (ev.entity_type === "update_link") {
      // entity_id is directly the update ID
      clicksByUpdateId[ev.entity_id] = (clicksByUpdateId[ev.entity_id] || 0) + 1;
    }
  });

  // Debug: Log final counts
  if (process.env.NODE_ENV === "development") {
    const totalAlbumClicks = Object.values(clicksByAlbumId).reduce((sum, count) => sum + count, 0);
    console.log("[Dashboard] Total album clicks mapped:", totalAlbumClicks);
    console.log("[Dashboard] Albums with clicks:", Object.keys(clicksByAlbumId).length);
  }

  // Fetch all albums, events, and updates
  const entitiesStart = performance.now();
  const [{ data: allAlbums = [] }, { data: allEvents = [] }, { data: allUpdates = [] }] =
    await Promise.all([
      supabase.from("albums").select("id, title, slug, cover_image_url"),
      supabase.from("events").select("id, title, slug, flyer_image_url"),
      supabase.from("updates").select("id, title, slug, image_url"),
    ]);
  const entitiesTime = performance.now() - entitiesStart;
  console.log(
    `[Dashboard] Entities fetch: ${entitiesTime.toFixed(2)}ms (albums: ${allAlbums?.length || 0}, events: ${allEvents?.length || 0}, updates: ${allUpdates?.length || 0})`
  );

  // Build top performing pages array
  const topPerformingPages: TopPerformingPage[] = [];

  // Add albums
  (allAlbums || []).forEach((album: any) => {
    const pageViews = viewsByAlbumId[album.id] || 0;
    const clicks = clicksByAlbumId[album.id] || 0;
    if (pageViews > 0 || clicks > 0) {
      topPerformingPages.push({
        id: album.id,
        title: album.title,
        slug: album.slug,
        type: "album",
        pageViews,
        clicks,
        imageUrl: album.cover_image_url,
      });
    }
  });

  // Add events
  (allEvents || []).forEach((event: any) => {
    const pageViews = viewsByEventId[event.id] || 0;
    const clicks = clicksByEventId[event.id] || 0;
    if (pageViews > 0 || clicks > 0) {
      topPerformingPages.push({
        id: event.id,
        title: event.title,
        slug: event.slug,
        type: "event",
        pageViews,
        clicks,
        imageUrl: event.flyer_image_url,
      });
    }
  });

  // Add updates
  (allUpdates || []).forEach((update: any) => {
    const pageViews = viewsByUpdateId[update.id] || 0;
    const clicks = clicksByUpdateId[update.id] || 0;
    if (pageViews > 0 || clicks > 0) {
      topPerformingPages.push({
        id: update.id,
        title: update.title,
        slug: update.slug,
        type: "update",
        pageViews,
        clicks,
        imageUrl: update.image_url,
      });
    }
  });

  // Sort by page views descending and limit to top 20
  const sortingStart = performance.now();
  topPerformingPages.sort((a, b) => b.pageViews - a.pageViews);
  const topPerformingPagesLimited = topPerformingPages.slice(0, 20);
  const sortingTime = performance.now() - sortingStart;

  const totalTime = performance.now() - startTime;
  console.log(`[Dashboard] Top pages sorting: ${sortingTime.toFixed(2)}ms`);
  console.log(`[Dashboard] ========================================`);
  console.log(
    `[Dashboard] TOTAL TIME: ${totalTime.toFixed(2)}ms (${(totalTime / 1000).toFixed(2)}s)`
  );
  console.log(`[Dashboard] ========================================`);

  return {
    albums: albumsStats,
    events: eventsStats,
    updates: updatesStats,
    websiteVisits,
    sectionItemVisits,
    sectionClicks,
    topPerformingPages: topPerformingPagesLimited,
  };
}
