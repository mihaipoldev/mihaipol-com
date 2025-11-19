import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUpdateBySlugAdmin } from "@/features/updates/data";
import { getEntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { EntityStatsDashboard } from "@/features/smart-links/analytics/components/EntityStatsDashboard";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { DashboardTimeScope } from "@/components/admin/DashboardTimeScope";
import { getAnalyticsScope } from "@/lib/analytics-scope";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ scope?: string }>;
};

export default async function UpdateStatsPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const params2 = await searchParams;
  const scope = await getAnalyticsScope(params2.scope);

  const update = await getUpdateBySlugAdmin(slug);

  if (!update) {
    redirect("/admin/updates");
  }

  const data = await getEntityAnalyticsData("update", update.id, scope);

  return (
    <>
      <div className="mb-4 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <AdminPageTitle
              title={update.title}
              description="View and analyze performance metrics for this update."
              entityType="update"
            />
          </div>
          <Suspense fallback={<div className="w-[140px] h-9" />}>
            <DashboardTimeScope />
          </Suspense>
        </div>
      </div>
      <EntityStatsDashboard data={data} entityType="update" entityTitle={update.title} />
    </>
  );
}
