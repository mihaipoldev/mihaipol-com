import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { getAnalyticsData } from "@/features/smart-links/analytics/data";
import { AnalyticsDashboard } from "@/features/smart-links/analytics/components/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();

  return (
    <>
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Analytics" 
        description="View and analyze your smart links performance, click-through rates, and engagement metrics."
      />
      </div>
      <AnalyticsDashboard data={data} />
    </>
  );
}


