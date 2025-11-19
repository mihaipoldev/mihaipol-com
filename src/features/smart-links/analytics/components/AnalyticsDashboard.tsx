"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminMetricTab } from "@/components/admin/AdminMetricTab";
import { AnalyticsLineChart } from "./AnalyticsLineChart";
import { getCardGradient } from "@/lib/gradient-presets";
import { cn } from "@/lib/utils";
import type { AnalyticsData } from "../data";

type AnalyticsDashboardProps = {
  data: AnalyticsData;
};

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const {
    totalPageViews,
    totalServiceClicks,
    visitsSeries,
    clicksSeries,
    perAlbumRows,
    perPlatformRows,
    topCountries,
  } = data;

  const totalAlbumPageViews = perAlbumRows.reduce((sum, r) => sum + (r.pageViews || 0), 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div
        className={cn(
          "rounded-xl overflow-hidden bg-card/50 text-card-foreground dark:bg-card/30 shadow-lg transition-all duration-300 hover:shadow-xl",
          getCardGradient()
        )}
      >
        <Tabs defaultValue="visits" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-transparent p-0 gap-0 overflow-hidden h-auto min-h-[88px] border-b border-border/30 rounded-none">
            <AdminMetricTab
              value="visits"
              label="Page Visits"
              metric={totalPageViews}
              subtitle="115% ↑"
              className="border-r border-border/30"
            />
            <AdminMetricTab
              value="clicks"
              label="Service Clicks"
              metric={totalServiceClicks}
              subtitle="181% ↑"
            />
          </TabsList>

          <TabsContent value="visits" className="mt-0 dark:bg-transparent">
            <div className="pr-6 pl-2 pt-10 pb-6">
              <AnalyticsLineChart data={visitsSeries} />
            </div>
          </TabsContent>

          <TabsContent value="clicks" className="mt-0 dark:bg-transparent">
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
                <th className="py-2 pr-4 w-44">Page Visits</th>
                <th className="py-2 pr-4 w-44">Clicks</th>
                <th className="py-2 pr-4 w-44">CTR</th>
              </tr>
            </thead>
            <tbody>
              {perAlbumRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="py-2 pr-4">
                    <Link
                      href={`/admin/albums/${row.slug}/stats`}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
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
                    </Link>
                  </td>
                  <td className="py-2 pr-4 w-44">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-right tabular-nums">{row.pageViews}</span>
                      {totalAlbumPageViews > 0 ? (
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-14 rounded-full bg-muted">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{
                                width: `${Math.min(100, (row.pageViews / totalAlbumPageViews) * 100)}%`,
                              }}
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
                      <span className="w-12 text-right tabular-nums">{row.ctr.toFixed(1)}%</span>
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
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4 w-4/5">Platform</th>
                <th className="py-2 pr-4 w-1/5">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {perPlatformRows.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="py-2 pr-4 w-4/5">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 rounded-md">
                        <AvatarImage src={row.iconUrl || undefined} alt={row.name} />
                        <AvatarFallback className="text-[10px] bg-muted">
                          {row.name
                            ?.split(" ")
                            .slice(0, 2)
                            .map((w: string) => w[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4 w-1/5">{row.clicks}</td>
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
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4 w-4/5">Country</th>
                <th className="py-2 pr-4 w-1/5">Events</th>
              </tr>
            </thead>
            <tbody>
              {topCountries.slice(0, 20).map((row) => (
                <tr key={row.country} className="border-t">
                  <td className="py-2 pr-4 w-4/5">{row.country}</td>
                  <td className="py-2 pr-4 w-1/5">{row.count}</td>
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
