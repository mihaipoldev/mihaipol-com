"use client";

import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { EntityStatsDashboard } from "@/features/smart-links/analytics/components/EntityStatsDashboard";
import type { EntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { Loader2 } from "lucide-react";
import type { Album } from "@/features/albums/types";

const STORAGE_KEY = "admin-analytics-scope";

function getStoredScope(): string {
  if (typeof window === "undefined") return "30";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ["7", "30", "90", "365", "all"].includes(stored)) {
    return stored;
  }
  return "30";
}

type AlbumAnalyticsTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialAnalytics?: EntityAnalyticsData; // Pre-fetched analytics for default scope (30 days)
};

function AnalyticsContent({ 
  albumId, 
  albumTitle, 
  initialAnalytics 
}: { 
  albumId: string; 
  albumTitle: string;
  initialAnalytics?: EntityAnalyticsData;
}) {
  // Initialize with pre-fetched data if available (instant loading!)
  const [analyticsData, setAnalyticsData] = useState<EntityAnalyticsData | null>(initialAnalytics || null);
  const [isLoading, setIsLoading] = useState(!initialAnalytics); // No loading if we have initial data
  const [error, setError] = useState<string | null>(null);
  
  // Get initial scope from localStorage, or default to "30"
  const getInitialScope = (): string => {
    return getStoredScope();
  };
  
  const [scope, setScope] = useState<string>(getInitialScope);

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newScope = e.newValue;
        if (["7", "30", "90", "365", "all"].includes(newScope)) {
          setScope(newScope);
        }
      }
    };

    // Poll for same-tab changes (storage event doesn't fire in same tab)
    const interval = setInterval(() => {
      const current = getStoredScope();
      if (current !== scope) {
        setScope(current);
      }
    }, 100);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [scope]);

  // Fetch analytics data when scope changes
  // Use initialAnalytics if scope is default (30) and we have it
  useEffect(() => {
    console.log('[Analytics] useEffect triggered', { scope, hasInitialAnalytics: !!initialAnalytics });
    
    // If scope is 30 and we have initial data, use it immediately without fetching
    if (scope === "30" && initialAnalytics) {
      console.log('[Analytics] Using pre-fetched data for scope 30');
      // Only update if data is not already set to avoid re-renders
      setAnalyticsData((current) => current === initialAnalytics ? current : initialAnalytics);
      setIsLoading(false);
      setError(null);
      return;
    }

    // For other scopes, fetch data
    console.log('[Analytics] Fetching data for scope:', scope);
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/albums/${albumId}/analytics`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const data = await response.json();
        setAnalyticsData(data);
        console.log('[Analytics] Data fetched successfully for scope:', scope);
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.2,
          delay: 0.05,
          ease: [0.4, 0, 0.2, 1],
        }}
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
  initialAnalytics,
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
      <AnalyticsContent 
        albumId={albumId} 
        albumTitle={initialAlbum.title}
        initialAnalytics={initialAnalytics}
      />
    </Suspense>
  );
}
