"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { EntityStatsDashboard } from "@/features/smart-links/analytics/components/EntityStatsDashboard";
import { DashboardTimeScope } from "@/components/admin/dashboard/DashboardTimeScope";
import { useSearchParams } from "next/navigation";
import type { EntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { Loader2 } from "lucide-react";
import type { Album } from "@/features/albums/types";

type AlbumAnalyticsTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
};

function AnalyticsContent({ albumId, albumTitle }: { albumId: string; albumTitle: string }) {
  const searchParams = useSearchParams();
  const [analyticsData, setAnalyticsData] = useState<EntityAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<string>("30");

  // Get scope from URL or default to "30"
  useEffect(() => {
    const urlScope = searchParams.get("scope");
    if (urlScope && ["7", "30", "90", "365", "all"].includes(urlScope)) {
      setScope(urlScope);
    }
  }, [searchParams]);

  // Fetch analytics data when scope changes
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/albums/${albumId}/analytics?scope=${scope}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const data = await response.json();
        setAnalyticsData(data);
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to load analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [albumId, scope]);

  if (isLoading) {
    return (
      <motion.div
        className="w-full flex items-center justify-center min-h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="flex items-center justify-center h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading analytics</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!analyticsData) {
    return (
      <motion.div
        className="flex items-center justify-center h-[400px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <p className="text-muted-foreground">No analytics data available</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="flex items-center justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        <DashboardTimeScope />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <EntityStatsDashboard
          data={analyticsData}
          entityType="album"
          entityTitle={albumTitle}
        />
      </motion.div>
    </motion.div>
  );
}

export function AlbumAnalyticsTab({
  albumId,
  isNew,
  initialAlbum,
}: AlbumAnalyticsTabProps) {
  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to view analytics.
      </motion.p>
    );
  }

  if (!initialAlbum) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Album not found.
      </motion.p>
    );
  }

  return (
    <Suspense
      fallback={
        <motion.div
          className="w-full flex items-center justify-center min-h-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading analytics...</p>
          </div>
        </motion.div>
      }
    >
      <AnalyticsContent albumId={albumId} albumTitle={initialAlbum.title} />
    </Suspense>
  );
}
