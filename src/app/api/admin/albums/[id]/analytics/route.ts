import { NextRequest } from "next/server";
import { getEntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { getAnalyticsScope } from "@/lib/analytics-scope";
import { ok, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { id } = await params;
    const scope = await getAnalyticsScope();

    const data = await getEntityAnalyticsData("album", id, scope);

    return ok(data);
  } catch (error: any) {
    console.error("Error fetching album analytics:", error);
    return serverError("Failed to fetch analytics", error?.message);
  }
}
