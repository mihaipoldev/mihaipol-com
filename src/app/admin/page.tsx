import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardHeader } from "@/components/admin/dashboard/DashboardHeader";
import { getDashboardData } from "@/features/admin/dashboard/data";
import { DashboardCards } from "@/components/admin/dashboard/DashboardCards";
import { DashboardCharts } from "@/components/admin/dashboard/DashboardCharts";
import { Loader2 } from "lucide-react";
import { getAnalyticsScope } from "@/lib/analytics-scope";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

function DashboardContent({ scope }: { scope: string }) {
  return (
    <Suspense fallback={<DashboardLoadingScreen />}>
      <DashboardContentInner scope={scope} />
    </Suspense>
  );
}

async function DashboardContentInner({ scope }: { scope: string }) {
  const data = await getDashboardData(scope);

  return (
    <div className="space-y-6">
      <DashboardCards data={data} />
      <DashboardCharts data={data} />
    </div>
  );
}

function DashboardLoadingScreen() {
  return (
    <div className="w-full flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    </div>
  );
}

type PageProps = {
  searchParams: Promise<{ scope?: string }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const scope = await getAnalyticsScope(params.scope);

  return (
    <div className="w-full">
      <DashboardHeader />
      <DashboardContent scope={scope} />
    </div>
  );
}
