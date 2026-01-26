"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Album, AlbumLink, AlbumImage, AlbumAudio, Platform, Label } from "@/features/albums/types";
import type { AlbumArtist, Artist } from "@/features/artists/components/ArtistSelect";
import type { EntityWorkflowData } from "@/features/workflows/data-server";
import type { EntityAnalyticsData } from "@/features/smart-links/analytics/data";
import { AlbumHeroSection } from "./AlbumHeroSection";
import { AlbumOverviewTab } from "./tabs/AlbumOverviewTab";
import { AlbumAnalyticsTab } from "./tabs/AlbumAnalyticsTab";
import { AlbumLinksTab } from "./tabs/AlbumLinksTab";
import { AlbumContentTab } from "./tabs/AlbumContentTab";
import { AlbumAutomationsTab } from "./tabs/AlbumAutomationsTab";
import { AlbumCanvasTab } from "./tabs/AlbumCanvasTab";
import { useAlbumTabs } from "../hooks/useAlbumTabs";

type AlbumPageProps = {
  id: string;
  isNew: boolean;
  initialAlbum: Album | null;
  initialLinks: AlbumLink[];
  initialAlbumArtists: AlbumArtist[];
  labels: Label[];
  platforms: Platform[];
  artists: Artist[];
  initialWorkflowData?: EntityWorkflowData; // Pre-fetched workflow data for instant loading
  initialAnalytics?: EntityAnalyticsData; // Pre-fetched analytics data for default scope (30 days)
};

export function AlbumPage({
  id,
  isNew,
  initialAlbum,
  initialLinks,
  initialAlbumArtists: _initialAlbumArtists,
  labels: _initialLabels,
  platforms: initialPlatforms,
  artists: _initialArtists,
  initialWorkflowData,
  initialAnalytics,
}: AlbumPageProps) {
  // Tab management with URL sync
  const { activeTab, setActiveTab } = useAlbumTabs();

  const [albumImages, setAlbumImages] = useState<AlbumImage[]>(initialAlbum?.album_images || []);
  const [albumAudios, setAlbumAudios] = useState<AlbumAudio[]>(initialAlbum?.album_audios || []);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);

  // Refs for tab elements to measure position
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number } | null>(null);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [hoverIndicatorStyle, setHoverIndicatorStyle] = useState<{ left: number; width: number } | null>(null);

  // Initialize images and audios when initialAlbum changes
  useEffect(() => {
    if (initialAlbum && !isNew) {
      setAlbumImages(initialAlbum.album_images || []);
      setAlbumAudios(initialAlbum.album_audios || []);
    } else {
      setAlbumImages([]);
      setAlbumAudios([]);
    }
  }, [initialAlbum, isNew]);

  // Update hover indicator position when hovered tab changes
  useEffect(() => {
    if (hoveredTab) {
      requestAnimationFrame(() => {
        const hoveredTabElement = tabRefs.current[hoveredTab];
        if (hoveredTabElement) {
          const parent = hoveredTabElement.closest('.inline-flex');
          if (parent) {
            const parentRect = parent.getBoundingClientRect();
            const tabRect = hoveredTabElement.getBoundingClientRect();
            const left = tabRect.left - parentRect.left;
            const width = tabRect.width;
            setHoverIndicatorStyle({ left, width });
          }
        }
      });
    } else {
      setHoverIndicatorStyle(null);
    }
  }, [hoveredTab]);
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const parent = activeTabElement.closest('.inline-flex');
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const tabRect = activeTabElement.getBoundingClientRect();
          // For Overview tab, the tab already extends left with -ml-4, so just use its natural position
          const left = tabRect.left - parentRect.left;
          const width = tabRect.width;
          setIndicatorStyle({ left, width });
        }
      }
    });
  }, [activeTab]);

  // Update indicator position on window resize
  useEffect(() => {
    const handleResize = () => {
      const activeTabElement = tabRefs.current[activeTab];
      if (activeTabElement) {
        const parent = activeTabElement.closest('.inline-flex');
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          const tabRect = activeTabElement.getBoundingClientRect();
          // For Overview tab, the tab already extends left with -ml-4, so just use its natural position
          const left = tabRect.left - parentRect.left;
          const width = tabRect.width;
          setIndicatorStyle({ left, width });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);

  return (
    <div className="w-full max-w-7xl relative">
      {/* Hero Section - Persistent across all tabs */}
      <AlbumHeroSection
        albumId={id}
        isNew={isNew}
        initialAlbum={initialAlbum}
      />

      <motion.div
        className="space-y-6 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Tabs Navigation - Outside Card */}
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <div className="w-full relative">
            <TabsList className="inline-flex h-auto h-12 items-center justify-start gap-0 bg-transparent p-0 w-full rounded-none">
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.overview = el;
                }}
                value="overview"
                onMouseEnter={() => setHoveredTab("overview")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/85 data-[state=inactive]:hover:text-foreground h-[34px] -ml-4 pl-4 pr-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Overview
                </span>
              </TabsTrigger>
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.analytics = el;
                }}
                value="analytics"
                onMouseEnter={() => setHoveredTab("analytics")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/90 data-[state=inactive]:hover:text-foreground h-[34px] px-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Analytics
                </span>
              </TabsTrigger>
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.links = el;
                }}
                value="links"
                onMouseEnter={() => setHoveredTab("links")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/85 data-[state=inactive]:hover:text-foreground h-[34px] px-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Links
                </span>
              </TabsTrigger>
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.content = el;
                }}
                value="content"
                onMouseEnter={() => setHoveredTab("content")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/85 data-[state=inactive]:hover:text-foreground h-[34px] px-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Content
                </span>
              </TabsTrigger>
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.automations = el;
                }}
                value="automations"
                onMouseEnter={() => setHoveredTab("automations")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/85 data-[state=inactive]:hover:text-foreground h-[34px] px-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Automations
                </span>
              </TabsTrigger>
              <TabsTrigger
                ref={(el) => {
                  tabRefs.current.canvas = el;
                }}
                value="canvas"
                onMouseEnter={() => setHoveredTab("canvas")}
                onMouseLeave={() => setHoveredTab(null)}
                className="rounded-[4px] relative z-10 data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground/75 data-[state=inactive]:hover:text-foreground h-[34px] px-3 font-medium transition-colors duration-150 flex items-center"
                disabled={isNew}
              >
                <span className="inline-block relative">
                  Canvas
                </span>
              </TabsTrigger>
            </TabsList>
            {/* Animated hover background indicator */}
            {hoverIndicatorStyle && (
              <motion.div
                className="absolute top-[7px] h-[34px] bg-muted-foreground/10 rounded-[4px] pointer-events-none z-0"
                initial={false}
                animate={{
                  left: hoverIndicatorStyle.left,
                  width: hoverIndicatorStyle.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 3000,
                  damping: 200,
                }}
              />
            )}
            {/* Animated indicator line */}
            {indicatorStyle && (
              <motion.div
                className="absolute bottom-0 h-[2px] bg-foreground"
                initial={false}
                animate={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              />
            )}
          </div>

          {/* Tab Content Sections */}
          <TabsContent value="overview" className="mt-6">
            <AlbumOverviewTab
              albumId={id}
              isNew={isNew}
              initialAlbum={initialAlbum}
              initialLinks={initialLinks}
              initialImages={albumImages}
              initialAudios={albumAudios}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <AlbumAnalyticsTab
              albumId={id}
              isNew={isNew}
              initialAlbum={initialAlbum}
              initialAnalytics={initialAnalytics}
            />
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <AlbumLinksTab
              albumId={id}
              isNew={isNew}
              initialAlbum={initialAlbum}
              initialLinks={initialLinks}
              initialPlatforms={platforms}
              onPlatformsChange={setPlatforms}
            />
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <AlbumContentTab
              albumId={id}
              isNew={isNew}
              initialAlbum={initialAlbum}
              initialImages={albumImages}
              initialAudios={albumAudios}
              coverImageUrl={initialAlbum?.cover_image_url || null}
              onImagesChange={setAlbumImages}
              onAudiosChange={setAlbumAudios}
            />
          </TabsContent>

          <TabsContent value="automations" className="mt-6">
            <AlbumAutomationsTab
              albumId={id}
              isNew={isNew}
              initialWorkflowData={initialWorkflowData}
              // Images and audios are no longer passed - they're fetched lazily when needed
            />
          </TabsContent>

          <TabsContent value="canvas" className="mt-6">
            <AlbumCanvasTab
              albumId={id}
              isNew={isNew}
              initialWorkflows={initialWorkflowData?.workflows}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
