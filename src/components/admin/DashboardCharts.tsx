"use client";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { AdminMetricTab } from "@/components/admin/AdminMetricTab";
import { AnalyticsLineChart } from "@/features/smart-links/analytics/components/AnalyticsLineChart";
import { SectionClicksChart } from "./SectionClicksChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DashboardData } from "@/features/admin/dashboard/data";

type AlbumRow = {
  id: string;
  title: string;
  coverImageUrl: string | null;
  pageViews: number;
  clicks: number;
  ctr: number;
};

type DashboardChartsProps = {
  data: DashboardData;
  albumAnalytics?: {
    perAlbumRows: AlbumRow[];
    totalAlbumPageViews: number;
  };
};

export function DashboardCharts({ data, albumAnalytics }: DashboardChartsProps) {
  return (
    <div className="space-y-8">
      {/* Website Visits and Section Clicks Tabs */}
      <div className="relative overflow-hidden shadow-lg rounded-xl">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
          style={{ animationDelay: "300ms" }}
        />

        <Tabs defaultValue="visits" className="w-full relative">
          <TabsList className="grid grid-cols-3 w-full bg-transparent p-0 gap-0 overflow-hidden h-auto min-h-[88px] border-b border-border/30 rounded-none">
            <AdminMetricTab
              value="visits"
              label="Website Visits"
              metric={data.websiteVisits.total}
              className="border-r border-border/30"
            />
            <AdminMetricTab
              value="item-visits"
              label="Section Item Visits"
              metric={data.sectionItemVisits.total}
              className="border-r border-border/30"
            />
            <AdminMetricTab
              value="sections"
              label="Section Views"
              metric={
                data.sectionClicks.albums.reduce((s, d) => s + d.count, 0) +
                data.sectionClicks.updates.reduce((s, d) => s + d.count, 0) +
                data.sectionClicks.events.reduce((s, d) => s + d.count, 0)
              }
            />
          </TabsList>

          <TabsContent value="visits" className="mt-0 dark:bg-transparent">
            <div className="pr-6 pl-2 pt-10 pb-6">
              <AnalyticsLineChart data={data.websiteVisits.series} />
            </div>
            {/* Analysis Table */}
            <div className="px-6 pb-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Visits</p>
                    <p className="text-2xl font-bold mt-1">{data.websiteVisits.total}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last 30 Days</p>
                    <p className="text-2xl font-bold mt-1">
                      {data.websiteVisits.series.reduce((sum, d) => sum + d.count, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg Daily</p>
                    <p className="text-2xl font-bold mt-1">
                      {Math.round(
                        data.websiteVisits.series.reduce((sum, d) => sum + d.count, 0) / 30
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Peak Day</p>
                    <p className="text-2xl font-bold mt-1">
                      {Math.max(...data.websiteVisits.series.map((d) => d.count))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="item-visits" className="mt-0 dark:bg-transparent">
            <div className="pr-6 pl-2 pt-10 pb-6">
              <SectionClicksChart data={data.sectionItemVisits} />
            </div>
          </TabsContent>

          <TabsContent value="sections" className="mt-0 dark:bg-transparent">
            <div className="pr-6 pl-2 pt-10 pb-6">
              <SectionClicksChart data={data.sectionClicks} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Album Analytics Section */}
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
              {albumAnalytics && albumAnalytics.perAlbumRows.length > 0 ? (
                albumAnalytics.perAlbumRows.map((row) => (
                  <tr key={row.id} className="border-t">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-md">
                          <AvatarImage src={row.coverImageUrl || undefined} alt={row.title} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {row.title
                              ?.split(" ")
                              .slice(0, 2)
                              .map((w: string) => w[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{row.title}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 w-44">
                      <div className="flex items-center gap-3">
                        <span>{row.pageViews}</span>
                        {albumAnalytics.totalAlbumPageViews > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-14 rounded-full bg-muted">
                              <div
                                className="h-2 rounded-full bg-primary"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    (row.pageViews / albumAnalytics.totalAlbumPageViews) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {((row.pageViews / albumAnalytics.totalAlbumPageViews) * 100).toFixed(
                                1
                              )}
                              %
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
                ))
              ) : (
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
    </div>
  );
}
