"use client";

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

type AlbumOverviewTabProps = {
  albumId: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialLinks: AlbumLink[];
  initialImages?: AlbumImage[];
  initialAudios?: AlbumAudio[];
};

export function AlbumOverviewTab({
  albumId,
  isNew,
  initialAlbum,
  initialLinks,
  initialImages = [],
  initialAudios = [],
}: AlbumOverviewTabProps) {
  const { setActiveTab } = useAlbumTabs();
  
  // Fetch analytics data using shared hook (prevents duplicate requests)
  const { data: analyticsData, loading: isLoadingAnalytics } = useAlbumAnalytics(
    albumId,
    "30",
    !isNew && !!initialAlbum
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
            "p-6 rounded-lg border border-border bg-card/50",
            "hover:bg-card hover:shadow-md transition-all duration-200 cursor-pointer",
            "group"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Analytics</h3>
            </div>
          </div>

          {isLoadingAnalytics ? (
            <div className="h-[220px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : analyticsData ? (
            <>
              <div className="mb-4 -mx-2">
                <AnalyticsLineChart
                  data={analyticsData.visitsSeries}
                />
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total Visits</div>
                  <div className="text-lg font-semibold">
                    {formatNumber(analyticsData.totalPageViews)}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground">Total Clicks</div>
                  <div className="text-lg font-semibold">
                    {formatNumber(analyticsData.totalServiceClicks)}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 w-full group-hover:bg-accent"
                onClick={(e) => handleButtonClick(e, "analytics")}
              >
                View Full Analytics
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <div className="h-[120px] flex items-center justify-center text-muted-foreground">
              No analytics data available
            </div>
          )}
        </motion.div>

        {/* Links Card */}
        <motion.div
          onClick={() => handleCardClick("links")}
          className={cn(
            "p-6 rounded-lg border border-border bg-card/50",
            "hover:bg-card hover:shadow-md transition-all duration-200 cursor-pointer",
            "group"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Distribution Links</h3>
            </div>
          </div>

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
              <Button
                variant="ghost"
                size="sm"
                className="w-full group-hover:bg-accent"
                onClick={(e) => handleButtonClick(e, "links")}
              >
                Manage Links
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No links added yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full group-hover:bg-accent"
                onClick={(e) => handleButtonClick(e, "links")}
              >
                Add Links
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Content Card */}
        <motion.div
          onClick={() => handleCardClick("content")}
          className={cn(
            "p-6 rounded-lg border border-border bg-card/50",
            "hover:bg-card hover:shadow-md transition-all duration-200 cursor-pointer",
            "group"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <ImageIcon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Media Assets</h3>
            </div>
          </div>

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
              <Button
                variant="ghost"
                size="sm"
                className="w-full group-hover:bg-accent"
                onClick={(e) => handleButtonClick(e, "content")}
              >
                Manage Assets
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">No content uploaded yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="w-full group-hover:bg-accent"
                onClick={(e) => handleButtonClick(e, "content")}
              >
                Add Content
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </motion.div>

        {/* Automations Card */}
        <motion.div
          onClick={() => handleCardClick("automations")}
          className={cn(
            "p-6 rounded-lg border border-border bg-card/50",
            "hover:bg-card hover:shadow-md transition-all duration-200 cursor-pointer",
            "group"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.2 }}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Automations</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                No active automations
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full group-hover:bg-accent"
              onClick={(e) => handleButtonClick(e, "automations")}
            >
              Set Up
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
