import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { getDashboardData } from "@/features/admin/dashboard/data";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

function DashboardContent() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton />}>
      <DashboardContentInner />
    </Suspense>
  );
}

async function DashboardContentInner() {
  const data = await getDashboardData();

  return (
    <div className="space-y-8">
      <DashboardCards data={data} />
      <DashboardCharts data={data} />
    </div>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Cards Skeleton - Match DashboardMetricCard styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className={cn(
              "relative overflow-hidden shadow-lg transition-all duration-300"
            )}
          >
            {/* Decorative gradient overlay - matching actual card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

            {/* Sparkle decorations - matching actual card */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
            <div
              className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
              style={{ animationDelay: "300ms" }}
            />

            <CardContent className="p-6 relative">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-10 w-24" />
                  </div>
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <div className="pt-4 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-6 w-12" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton - Match chart card styling */}
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  return (
    <div className="w-full">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle 
          title="Admin Dashboard" 
          description="Overview of your content, analytics, and engagement metrics."
        />
      </div>

      <DashboardContent />
    </div>
  );
}
