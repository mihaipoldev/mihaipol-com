"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { AdminMetricTab } from "./AdminMetricTab";
import { AnalyticsLineChart } from "@/features/smart-links/analytics/components/AnalyticsLineChart";
import { SectionClicksChart } from "./SectionClicksChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/features/admin/dashboard/data";
import { motion } from "framer-motion";

type DashboardChartsProps = {
  data: DashboardData;
};

export function DashboardCharts({ data }: DashboardChartsProps) {
  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Website Visits and Section Clicks Tabs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
      <Card className="relative overflow-hidden shadow-lg transition-all duration-300">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Sparkle decorations */}
          <motion.div
            className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm"
            animate={{
              opacity: [0.2, 0.5, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.3,
            }}
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
              label="Page Visits"
              metric={data.sectionItemVisits.total}
              className="border-r border-border/30"
            />
            <AdminMetricTab
              value="sections"
              label="Section Visits"
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
      </Card>
      </motion.div>

      {/* Top Performing Pages Section */}
      <motion.section
        className="space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.4 }}
      >
        <h2 className="text-xl font-semibold">Top Performing Page</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="py-2 pr-4">Page</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4 w-44">Page Visits</th>
                <th className="py-2 pr-4 w-24">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {data.topPerformingPages && data.topPerformingPages.length > 0 ? (
                (() => {
                  const totalPageViews = data.topPerformingPages.reduce(
                    (sum, p) => sum + p.pageViews,
                    0
                  );
                  const getTypeColor = (type: string) => {
                    switch (type) {
                      case "album":
                        return {
                          badgeClassName:
                            "bg-blue-500 text-white dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500",
                          progress: "bg-blue-500",
                        };
                      case "event":
                        return {
                          badgeClassName:
                            "bg-orange-500 text-white dark:bg-orange-500/10 dark:text-orange-500 dark:border-orange-500",
                          progress: "bg-orange-500",
                        };
                      case "update":
                        return {
                          badgeClassName:
                            "bg-emerald-500 text-white dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500",
                          progress: "bg-emerald-500",
                        };
                      default:
                        return {
                          badgeClassName: "bg-muted text-muted-foreground",
                          progress: "bg-primary",
                        };
                    }
                  };

                  return data.topPerformingPages.map((page, index) => {
                    const colors = getTypeColor(page.type);
                    const statsHref = `/admin/${page.type}s/${page.slug}/stats`;
                    return (
                      <motion.tr
                        key={`${page.type}-${page.id}`}
                        className="border-t hover:bg-primary/5 transition-colors"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.8 + index * 0.05, duration: 0.3 }}
                      >
                        <td className="py-2 pr-4">
                          <Link
                            href={statsHref}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Avatar className="h-6 w-6 rounded-md">
                              <AvatarImage src={page.imageUrl || undefined} alt={page.title} />
                              <AvatarFallback className="text-[10px] bg-muted">
                                {page.title
                                  ?.split(" ")
                                  .slice(0, 2)
                                  .map((w: string) => w[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>{page.title}</span>
                          </Link>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant="secondary"
                            className={cn("capitalize border dark:border", colors.badgeClassName)}
                          >
                            {page.type}
                          </Badge>
                        </td>
                        <td className="py-2 pr-4 w-44">
                          <div className="flex items-center gap-3">
                            <span className="w-8 text-right tabular-nums">{page.pageViews}</span>
                            {totalPageViews > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-14 rounded-full bg-muted">
                                  <div
                                    className={`h-2 rounded-full ${colors.progress}`}
                                    style={{
                                      width: `${Math.min(
                                        100,
                                        (page.pageViews / totalPageViews) * 100
                                      )}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-[11px] text-muted-foreground">
                                  {((page.pageViews / totalPageViews) * 100).toFixed(1)}%
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2 pr-4 w-24">
                          <span className="text-sm text-muted-foreground">{page.clicks}                          </span>
                        </td>
                      </motion.tr>
                    );
                  });
                })()
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
      </motion.section>
    </motion.div>
  );
}
