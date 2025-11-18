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

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getServiceSupabaseClient();
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayISO = today.toISOString().split("T")[0];

  // Calculate 12 months ago
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twelveMonthsAgoISO = twelveMonthsAgo.toISOString().split("T")[0];

  // Fetch albums stats
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

  const eventsStats: EventsStats = {
    past: pastEvents || 0,
    upcoming: upcomingEvents || 0,
  };

  // Fetch updates stats
  const [{ count: totalUpdates }, { data: updatesByStatus }] = await Promise.all([
    supabase.from("updates").select("*", { count: "exact", head: true }),
    supabase.from("updates").select("publish_status"),
  ]);

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

  // Fetch analytics data for website visits (last 30 days)
  // Use session_start events for website visits (one per session)
  const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalPageViews }, { data: recentSessionStarts }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "session_start"),
    supabase
      .from("analytics_events")
      .select("created_at")
      .eq("event_type", "session_start")
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
  ]);

  // Build daily series for website visits
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const startTs = dayStart.getTime() - 29 * 24 * 60 * 60 * 1000;
  const dayKeys: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(startTs + i * 24 * 60 * 60 * 1000);
    dayKeys.push(toDayKey(d.toISOString()));
  }
  const visitsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));

  if (recentSessionStarts) {
    for (const ev of recentSessionStarts) {
      const key = toDayKey(ev.created_at);
      if (key in visitsByDay) {
        visitsByDay[key] += 1;
      }
    }
  }

  const websiteVisitsSeries = dayKeys.map((k) => ({
    date: k,
    count: visitsByDay[k] || 0,
  }));

  const websiteVisits: WebsiteVisitsData = {
    total: totalPageViews || 0,
    series: websiteVisitsSeries,
  };

  // Fetch section item visits data (page_view events for albums, events, updates - last 30 days)
  const [{ count: totalItemViews }, { data: recentItemViews }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .eq("event_type", "page_view")
      .in("entity_type", ["album", "event", "update"]),
    supabase
      .from("analytics_events")
      .select("created_at, entity_type")
      .eq("event_type", "page_view")
      .in("entity_type", ["album", "event", "update"])
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: true }),
  ]);

  // Build daily series for each entity type
  const albumsItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );
  const eventsItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );
  const updatesItemVisitsByDay: Record<string, number> = Object.fromEntries(
    dayKeys.map((k) => [k, 0])
  );

  if (recentItemViews) {
    for (const ev of recentItemViews) {
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
  }

  const sectionItemVisits: SectionItemVisitsData = {
    total: totalItemViews || 0,
    albums: dayKeys.map((k) => ({ date: k, count: albumsItemVisitsByDay[k] || 0 })),
    events: dayKeys.map((k) => ({ date: k, count: eventsItemVisitsByDay[k] || 0 })),
    updates: dayKeys.map((k) => ({ date: k, count: updatesItemVisitsByDay[k] || 0 })),
  };

  // Fetch section clicks data (last 30 days)
  const { data: sectionViews } = await supabase
    .from("analytics_events")
    .select("created_at, entity_id")
    .eq("event_type", "section_view")
    .eq("entity_type", "site_section")
    .in("entity_id", ["albums", "updates", "events"])
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: true });

  // Build daily series for each section
  const albumsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const updatesByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));
  const eventsByDay: Record<string, number> = Object.fromEntries(dayKeys.map((k) => [k, 0]));

  if (sectionViews) {
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
  }

  const sectionClicks: SectionClicksData = {
    albums: dayKeys.map((k) => ({ date: k, count: albumsByDay[k] || 0 })),
    updates: dayKeys.map((k) => ({ date: k, count: updatesByDay[k] || 0 })),
    events: dayKeys.map((k) => ({ date: k, count: eventsByDay[k] || 0 })),
  };

  // Fetch top performing pages (albums, events, updates) with page views and clicks
  const MAX_ROWS = 5000;
  const [
    { data: albumPageViews = [] },
    { data: eventPageViews = [] },
    { data: updatePageViews = [] },
    { data: linkClicks = [] },
  ] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("entity_id")
      .eq("event_type", "page_view")
      .eq("entity_type", "album")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("entity_id")
      .eq("event_type", "page_view")
      .eq("entity_type", "event")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("entity_id")
      .eq("event_type", "page_view")
      .eq("entity_type", "update")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
    supabase
      .from("analytics_events")
      .select("entity_id, entity_type")
      .eq("event_type", "link_click")
      .order("created_at", { ascending: false })
      .range(0, MAX_ROWS - 1),
  ]);

  // Count page views by entity ID
  const viewsByAlbumId: Record<string, number> = {};
  const viewsByEventId: Record<string, number> = {};
  const viewsByUpdateId: Record<string, number> = {};

  (albumPageViews || []).forEach((ev: any) => {
    viewsByAlbumId[ev.entity_id] = (viewsByAlbumId[ev.entity_id] || 0) + 1;
  });
  (eventPageViews || []).forEach((ev: any) => {
    viewsByEventId[ev.entity_id] = (viewsByEventId[ev.entity_id] || 0) + 1;
  });
  (updatePageViews || []).forEach((ev: any) => {
    viewsByUpdateId[ev.entity_id] = (viewsByUpdateId[ev.entity_id] || 0) + 1;
  });

  // Map link clicks to albums via album_links
  const { data: albumLinks = [] } = await supabase
    .from("album_links")
    .select("id, album_id");
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
      console.log("[Dashboard] Mapping result:", albumIdByLinkId.get(String(sampleClick.entity_id)));
      console.log("[Dashboard] All album link IDs in map:", Array.from(albumIdByLinkId.keys()).slice(0, 5));
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
  const [
    { data: allAlbums = [] },
    { data: allEvents = [] },
    { data: allUpdates = [] },
  ] = await Promise.all([
    supabase.from("albums").select("id, title, cover_image_url"),
    supabase.from("events").select("id, title, flyer_image_url"),
    supabase.from("updates").select("id, title, image_url"),
  ]);

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
        type: "update",
        pageViews,
        clicks,
        imageUrl: update.image_url,
      });
    }
  });

  // Sort by page views descending and limit to top 20
  topPerformingPages.sort((a, b) => b.pageViews - a.pageViews);
  const topPerformingPagesLimited = topPerformingPages.slice(0, 20);

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
