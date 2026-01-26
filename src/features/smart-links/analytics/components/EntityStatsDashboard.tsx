"use client";

import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AdminMetricTab } from "@/components/admin/dashboard/AdminMetricTab";
import { DashboardTimeScope } from "@/components/admin/dashboard/DashboardTimeScope";
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
      {/* Overview Section */}
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
              Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-5">
              Track page visits and service clicks over time
            </p>
          </div>
          <div className="flex-shrink-0 pt-1">
            <DashboardTimeScope />
          </div>
        </div>
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
                disableAnimations={true}
              />
              <AdminMetricTab
                value="clicks"
                label="Service Clicks"
                metric={totalServiceClicks}
                subtitle=""
                disableAnimations={true}
              />
            </TabsList>

            <TabsContent value="visits" className="mt-0 dark:bg-transparent">
              <div className="pr-6 pl-2 pt-10 pb-6">
                <AnalyticsLineChart data={visitsSeries} />
              </div>
            </TabsContent>

            <TabsContent value="clicks" className="mt-0 dark:bg-transparent">
              <div className="pr-6 pl-2 pt-10 pb-6">
                <AnalyticsLineChart data={clicksSeries} valueLabel="clicks" />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Platforms Section */}
      {showPlatforms && (
        <>
          <section className="space-y-5">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
              Top Performing Platforms
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-5">
              See which streaming platforms are getting the most engagement
            </p>
          </div>
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
        </>
      )}


      {/* Geographic Section */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
            Geographic Insights
          </h2>
          <p className="text-sm text-muted-foreground mt-2 ml-5">
            Discover where your audience is located around the world
          </p>
        </div>
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
