"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Album, AlbumLink, AlbumImage, AlbumAudio, Platform, Label } from "@/features/albums/types";
import type { AlbumArtist, Artist } from "@/features/artists/components/ArtistSelect";
import { cn } from "@/lib/utils";
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
}: AlbumPageProps) {
  // Tab management with URL sync
  const { activeTab, setActiveTab } = useAlbumTabs();

  const [albumImages, setAlbumImages] = useState<AlbumImage[]>(initialAlbum?.album_images || []);
  const [albumAudios, setAlbumAudios] = useState<AlbumAudio[]>(initialAlbum?.album_audios || []);
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms);

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

  return (
    <motion.div
      className="w-full max-w-7xl relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
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
          <div className="border-b border-border w-full">
            <TabsList className="inline-flex h-auto items-center justify-start gap-0 bg-transparent p-0 w-full rounded-none">
              <TabsTrigger
                value="overview"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 pl-0 pr-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "overview" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Overview
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 px-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "analytics" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Analytics
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="links"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 px-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "links" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Links
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 px-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "content" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Content
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="automations"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 px-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "automations" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Automations
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="canvas"
                className="rounded-none relative data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=inactive]:text-muted-foreground h-12 px-4 font-medium transition-colors flex items-center"
                disabled={isNew}
              >
                <span className={cn(
                  "inline-block relative",
                  activeTab === "canvas" && "after:content-[''] after:absolute after:bottom-[-14px] after:left-0 after:right-0 after:h-[3px] after:bg-foreground"
                )}>
                  Canvas
                </span>
              </TabsTrigger>
            </TabsList>
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
              initialImages={albumImages}
              initialAudios={albumAudios}
            />
          </TabsContent>

          <TabsContent value="canvas" className="mt-6">
            <AlbumCanvasTab
              albumId={id}
              isNew={isNew}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
