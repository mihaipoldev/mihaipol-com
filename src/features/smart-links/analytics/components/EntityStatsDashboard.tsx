"use client";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdminMetricTab } from "@/components/admin/AdminMetricTab";
import { AnalyticsLineChart } from "./AnalyticsLineChart";
import { getCardGradient } from "@/lib/gradient-presets";
import { cn } from "@/lib/utils";
import type { EntityAnalyticsData } from "../data";

type EntityStatsDashboardProps = {
  data: EntityAnalyticsData;
  entityType: "album" | "event" | "update";
  entityTitle: string;
};

export function EntityStatsDashboard({ data, entityType, entityTitle }: EntityStatsDashboardProps) {
  const {
    totalPageViews,
    totalServiceClicks,
    visitsSeries,
    clicksSeries,
    perPlatformRows,
    topCountries,
  } = data;

  const showPlatforms = entityType === "album";

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
              subtitle=""
              className="border-r border-border/30"
            />
            <AdminMetricTab
              value="clicks"
              label="Service Clicks"
              metric={totalServiceClicks}
              subtitle=""
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
      {showPlatforms && (
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
      )}

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
