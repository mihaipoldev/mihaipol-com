import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { getDashboardData } from "@/features/admin/dashboard/data";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { DashboardCharts } from "@/components/admin/DashboardCharts";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="w-full">
      <div className="mb-10 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Admin Dashboard" 
          description="Overview of your content, analytics, and engagement metrics."
      />
      </div>

      <div className="space-y-8">
        <DashboardCards data={data} />
        <DashboardCharts data={data} />
      </div>
    </div>
  );
}
