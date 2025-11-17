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

export type DashboardData = {
  albums: AlbumsStats;
  events: EventsStats;
  updates: UpdatesStats;
  websiteVisits: WebsiteVisitsData;
  sectionItemVisits: SectionItemVisitsData;
  sectionClicks: SectionClicksData;
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
  const sinceISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalPageViews }, { data: recentPageViews }] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("*", { count: "exact", head: true })
      .in("event_type", ["page_view", "section_view"]),
    supabase
      .from("analytics_events")
      .select("created_at, event_type")
      .in("event_type", ["page_view", "section_view"])
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

  if (recentPageViews) {
    for (const ev of recentPageViews) {
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

  return {
    albums: albumsStats,
    events: eventsStats,
    updates: updatesStats,
    websiteVisits,
    sectionItemVisits,
    sectionClicks,
  };
}
