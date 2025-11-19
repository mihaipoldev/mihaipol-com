import { Suspense } from "react";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { DashboardTimeScope } from "@/components/admin/DashboardTimeScope";
import { getAnalyticsData } from "@/features/smart-links/analytics/data";
import { AnalyticsDashboard } from "@/features/smart-links/analytics/components/AnalyticsDashboard";
import { getAnalyticsScope } from "@/lib/analytics-scope";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ scope?: string }>;
};

async function AnalyticsContent({ scope }: { scope: string }) {
  const data = await getAnalyticsData(scope);
  return <AnalyticsDashboard data={data} />;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const scope = await getAnalyticsScope(params.scope);

  return (
    <>
      <div className="mb-4 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <AdminPageTitle
              title="Analytics"
              description="View and analyze your smart links performance, click-through rates, and engagement metrics."
            />
          </div>
          <Suspense fallback={<div className="w-[140px] h-9" />}>
            <DashboardTimeScope />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <AnalyticsContent scope={scope} />
      </Suspense>
    </>
  );
}
