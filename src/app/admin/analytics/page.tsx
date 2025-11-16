import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminMetricTab } from "@/components/admin/AdminMetricTab";
import { AnalyticsLineChart } from "@/components/analytics/AnalyticsLineChart";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

type CountMap = Record<string, number>;

export default async function AdminAnalyticsPage() {
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
  const MAX_ROWS = 5000;
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

  const topCountries: { country: string; count: number }[] = [];
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
  function toDayKey(d: string) {
    // use yyyy-MM-dd
    const date = new Date(d);
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
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

  const totalAlbumPageViews = perAlbumRows.reduce((sum, r) => sum + (r.pageViews || 0), 0);

  // Build per-platform rows
  const perPlatformRows = platformsSafe
    .map((p: any) => ({ name: p.name, iconUrl: p.icon_url, clicks: clicksByPlatformId[p.id] || 0 }))
    .filter((r) => r.clicks > 0)
    .sort((a, b) => b.clicks - a.clicks);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <AdminPageTitle title="Analytics" />

      <div className="rounded-xl border border-sidebar-border overflow-hidden">
        <Tabs defaultValue="visits" className="w-full">
        <TabsList className="grid grid-cols-2 w-full bg-transparent p-0 gap-0 overflow-hidden h-auto min-h-[88px]">
          <AdminMetricTab
            value="visits"
            label="Page Visits"
            metric={totalPageViews}
            subtitle="115% ↑"
            className="border-r"
          />
          <AdminMetricTab
            value="clicks"
            label="Service Clicks"
            metric={totalServiceClicks}
            subtitle="181% ↑"
          />
        </TabsList>

        <TabsContent value="visits" className="mt-0 bg-background">
          <div className="pr-6 pl-2 pt-10 pb-6">
            <AnalyticsLineChart data={visitsSeries} />
          </div>
        </TabsContent>

        <TabsContent value="clicks" className="mt-0 bg-background">
          <div className="pr-6 pl-2 pt-10 pb-6">
            <AnalyticsLineChart data={clicksSeries} />
          </div>
        </TabsContent>
        </Tabs>
      </div>
      
      {/* Sections outside tabs */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Top Performing Albums</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Album</th>
                <th className="py-2 pr-4 w-44">Page Views</th>
                <th className="py-2 pr-4 w-44">Clicks</th>
                <th className="py-2 pr-4 w-44">CTR</th>
              </tr>
            </thead>
            <tbody>
              {perAlbumRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 rounded-md">
                        <AvatarImage src={row.coverImageUrl || undefined} alt={row.title} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {row.title?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{row.title}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 w-44">
                    <div className="flex items-center gap-3">
                      <span>{row.pageViews}</span>
                      {totalAlbumPageViews > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-14 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${Math.min(100, (row.pageViews / totalAlbumPageViews) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {((row.pageViews / totalAlbumPageViews) * 100).toFixed(1)}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-2 pr-4 w-44">{row.clicks}</td>
                  <td className="py-2 pr-4 w-44">
                    <div className="flex items-center gap-2">
                      <span>{row.ctr.toFixed(1)}%</span>
                      <div className="h-2 w-14 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{ width: `${Math.min(100, row.ctr)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {perAlbumRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Top Performing Platforms</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Platform</th>
                <th className="py-2 pr-4">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {perPlatformRows.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 rounded-md">
                        <AvatarImage src={row.iconUrl || undefined} alt={row.name} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {row.name?.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4">{row.clicks}</td>
                </tr>
              ))}
              {perPlatformRows.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-muted-foreground">
                    No clicks yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Top Countries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Country</th>
                <th className="py-2 pr-4">Events</th>
              </tr>
            </thead>
            <tbody>
              {topCountries.slice(0, 20).map((row) => (
                <tr key={row.country} className="border-t">
                  <td className="py-2 pr-4">{row.country}</td>
                  <td className="py-2 pr-4">{row.count}</td>
                </tr>
              ))}
              {topCountries.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-muted-foreground">
                    No data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


