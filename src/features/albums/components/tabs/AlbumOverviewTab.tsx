"use client";

import { Suspense, useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AnalyticsLineChart } from "@/features/smart-links/analytics/components/AnalyticsLineChart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChart3, Link2, Image as ImageIcon, Zap, ArrowRight } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Album, AlbumLink, AlbumImage, AlbumAudio } from "@/features/albums/types";
import { useAlbumTabs } from "../../hooks/useAlbumTabs";
import { useAlbumAnalytics } from "../../hooks/useAlbumAnalytics";
import { DashboardTimeScope } from "@/components/admin/dashboard/DashboardTimeScope";

const STORAGE_KEY = "admin-analytics-scope";

function getStoredScope(): string {
  if (typeof window === "undefined") return "30";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ["7", "30", "90", "365", "all"].includes(stored)) {
    return stored;
  }
  return "30";
}

type AlbumOverviewTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialLinks: AlbumLink[];
  initialImages?: AlbumImage[];
  initialAudios?: AlbumAudio[];
};

function OverviewContent({
  albumId,
  initialAlbum,
  initialLinks,
  initialImages = [],
  initialAudios = [],
}: {
  albumId: string;
  initialAlbum: Album | null;
  initialLinks: AlbumLink[];
  initialImages: AlbumImage[];
  initialAudios: AlbumAudio[];
}) {
  const { setActiveTab } = useAlbumTabs();
  
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
  
  // Fetch analytics data using shared hook (prevents duplicate requests)
  const { data: analyticsData, loading: isLoadingAnalytics } = useAlbumAnalytics(
    albumId,
    scope,
    !!initialAlbum
  );

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const handleCardClick = (tab: "analytics" | "links" | "content" | "automations") => {
    setActiveTab(tab);
  };

  const handleButtonClick = (e: React.MouseEvent, tab: "analytics" | "links" | "content" | "automations") => {
    e.stopPropagation();
    e.preventDefault();
    setActiveTab(tab);
  };

  const topPlatforms = analyticsData?.perPlatformRows.slice(0, 4) || [];
  const displayImages = (initialImages || initialAlbum?.album_images || []).slice(0, 4);
  const imageCount = initialImages?.length || initialAlbum?.album_images?.length || 0;
  const audioCount = initialAudios?.length || initialAlbum?.album_audios?.length || 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Overview Section Header */}
      <section className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <span className="w-1.5 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full"></span>
              Overview
            </h2>
            <p className="text-sm text-muted-foreground mt-2 ml-5">
              Track page visits and service clicks over time
            </p>
          </div>
          <div className="flex-shrink-0 pt-1">
            <DashboardTimeScope />
          </div>
        </div>
      </section>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        {/* Analytics Card */}
        <motion.div
          onClick={() => handleCardClick("analytics")}
          className={cn(
            "relative p-5 rounded-xl bg-sidebar backdrop-blur-sm",
            "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
            "shadow-lg overflow-hidden",
            "hover:shadow-xl transition-all duration-300",
            "group cursor-pointer"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.05,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decorations */}
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />

          {/* Content */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground">Total Visits</h3>
              {analyticsData && !isLoadingAnalytics && (
                <div className="text-2xl font-bold text-foreground">
                  {formatNumber(analyticsData.totalPageViews)}
                </div>
              )}
            </div>

            {isLoadingAnalytics ? (
            <div className="h-[180px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : analyticsData ? (
            <>
              {analyticsData.visitsSeries && analyticsData.visitsSeries.length > 0 ? (
                <div className="-mx-[28px] -mb-4">
                  <AnalyticsLineChart
                    data={analyticsData.visitsSeries}
                    hideAxes={true}
                    hideYAxis={true}
                    height={160}
                    hideGrid={true}
                  />
                </div>
              ) : (
                <div className="h-[120px] flex items-center justify-center text-muted-foreground">
                  No chart data available
                </div>
              )}
            </>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground">
              No analytics data available
            </div>
          )}
          </div>
        </motion.div>

        {/* Links Card */}
        <motion.div
          onClick={() => handleCardClick("links")}
          className={cn(
            "relative p-5 rounded-xl bg-sidebar backdrop-blur-sm",
            "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
            "shadow-lg overflow-hidden",
            "hover:shadow-xl transition-all duration-300",
            "group cursor-pointer"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.1,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decorations */}
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />

          {/* Content */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-xl font-bold text-foreground">Distribution Links</h3>

          {topPlatforms.length > 0 ? (
            <>
              <div className="space-y-2 mb-4">
                {topPlatforms.map((platform) => (
                  <div
                    key={platform.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {platform.iconUrl && (
                        <Avatar className="h-5 w-5 rounded-md">
                          <AvatarImage src={platform.iconUrl} alt={platform.name} />
                          <AvatarFallback className="text-[10px] bg-muted">
                            {platform.name
                              .split(" ")
                              .slice(0, 2)
                              .map((w) => w[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="text-muted-foreground">{platform.name}</span>
                    </div>
                    <span className="font-medium">{formatNumber(platform.clicks)} clicks</span>
                  </div>
                ))}
                {initialLinks.length > 4 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{initialLinks.length - 4} more platforms
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No links added yet</p>
            </div>
          )}
          </div>
        </motion.div>

        {/* Content Card */}
        <motion.div
          onClick={() => handleCardClick("content")}
          className={cn(
            "relative p-5 rounded-xl bg-sidebar backdrop-blur-sm",
            "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
            "shadow-lg overflow-hidden",
            "hover:shadow-xl transition-all duration-300",
            "group cursor-pointer"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.15,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decorations */}
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />

          {/* Content */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-xl font-bold text-foreground">Media Assets</h3>

          {displayImages.length > 0 || audioCount > 0 ? (
            <>
              {displayImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {displayImages.map((img) => (
                    <div
                      key={img.id}
                      className="relative aspect-square rounded-md overflow-hidden border border-border bg-muted"
                    >
                      <Image
                        src={img.image_url}
                        alt={img.title || "Image"}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  {imageCount} {imageCount === 1 ? "image" : "images"}
                  {audioCount > 0 && `, ${audioCount} ${audioCount === 1 ? "audio file" : "audio files"}`}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No content uploaded yet</p>
            </div>
          )}
          </div>
        </motion.div>

        {/* Automations Card */}
        <motion.div
          onClick={() => handleCardClick("automations")}
          className={cn(
            "relative p-5 rounded-xl bg-sidebar backdrop-blur-sm",
            "bg-gradient-to-br from-primary/[2%] via-primary/[1%] to-transparent",
            "shadow-lg overflow-hidden",
            "hover:shadow-xl transition-all duration-300",
            "group cursor-pointer"
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.2,
            delay: 0.2,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

          {/* Sparkle decorations */}
          <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-6 right-8 w-1 h-1 bg-primary/20 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />

          {/* Content */}
          <div className="space-y-4 relative z-10">
            <h3 className="text-xl font-bold text-foreground">Automations</h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                No active automations
              </p>
            </div>
          </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function AlbumOverviewTab({
  albumId,
  isNew,
  initialAlbum,
  initialLinks,
  initialImages = [],
  initialAudios = [],
}: AlbumOverviewTabProps) {
  if (isNew) {
    return (
      <motion.p
        className="text-sm text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        Save the album first to view overview.
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
            <p className="text-sm text-muted-foreground">Loading overview...</p>
          </div>
        </motion.div>
      }
    >
      <OverviewContent
        albumId={albumId}
        initialAlbum={initialAlbum}
        initialLinks={initialLinks}
        initialImages={initialImages}
        initialAudios={initialAudios}
      />
    </Suspense>
  );
}
