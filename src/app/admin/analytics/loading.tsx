import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <>
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Analytics"
          description="View and analyze your smart links performance, click-through rates, and engagement metrics."
        />
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-8">
        {/* Metrics Card Skeleton */}
        <div className="rounded-xl overflow-hidden bg-card/50 shadow-lg">
          <div className="grid grid-cols-2 border-b border-border/30">
            <div className="p-6 border-r border-border/30">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="p-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>

        {/* Top Albums Table Skeleton */}
        <section className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="overflow-x-auto">
            <div className="w-full space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 border-t pt-3">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Platforms Table Skeleton */}
        <section className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="overflow-x-auto">
            <div className="w-full space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 border-t pt-3">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Top Countries Table Skeleton */}
        <section className="space-y-3">
          <Skeleton className="h-7 w-48" />
          <div className="overflow-x-auto">
            <div className="w-full space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 border-t pt-3">
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
