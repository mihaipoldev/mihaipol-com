"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Loader2, AlertCircle, Save } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleList, faImage } from "@fortawesome/free-regular-svg-icons";
import { faRectangleList as faRectangleListSolid, faImage as faImageSolid } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { HeroCarouselSettings, type HeroCarouselSaveRef } from "@/features/hero-carousel/components/HeroCarouselSettings";
import { useLandingPagePreferences } from "../hooks/useLandingPagePreferences";
import { usePreferenceValidation } from "../hooks/usePreferenceValidation";
import { getPreferenceSortOrder } from "../utils/preference-sort";
import type { PreferenceValue } from "../api/landing-page-preferences-api";
import { GeneralSection } from "./sections/GeneralSection";
import { FeatureSection } from "./sections/FeatureSection";
import { EventsSection } from "./sections/EventsSection";
import { AlbumsSection } from "./sections/AlbumsSection";
import { GriffithSection } from "./sections/GriffithSection";
import { UpdatesSection } from "./sections/UpdatesSection";

export function PreferencesSettings() {
  const queryClient = useQueryClient();
  const [localValues, setLocalValues] = useState<PreferenceValue>({});
  const [carouselSaveRef, setCarouselSaveRef] = useState<HeroCarouselSaveRef | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("layout");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const layoutTabRef = useRef<HTMLButtonElement>(null);
  const mediaTabRef = useRef<HTMLButtonElement>(null);

  const updateIndicator = useCallback(() => {
    const activeRef = activeTab === "layout" ? layoutTabRef.current : mediaTabRef.current;
    if (activeRef) {
      const parent = activeRef.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        const activeRect = activeRef.getBoundingClientRect();
        setIndicatorStyle({
          left: activeRect.left - parentRect.left,
          width: activeRect.width,
        });
      }
    }
  }, [activeTab]);

  const { preferences, isLoading, albums, albumsLoading, updateMutation } = useLandingPagePreferences();

  // Initialize local values when preferences load
  useEffect(() => {
    if (preferences) {
      const initialValues: PreferenceValue = {};
      preferences.forEach((pref) => {
        initialValues[pref.key] = pref.value;
      });
      setLocalValues(initialValues);
    }
  }, [preferences]);

  const handleValueChange = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const getPreferenceValue = (key: string): any => {
    return localValues[key] ?? preferences?.find((p) => p.key === key)?.value;
  };

  // Auto-update limit values when columns change
  usePreferenceValidation(localValues, preferences, getPreferenceValue, handleValueChange);

  // Update indicator position when active tab changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready, then a small delay for layout
    const rafId = requestAnimationFrame(() => {
      setTimeout(updateIndicator, 10);
    });
    
    window.addEventListener("resize", updateIndicator);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab, updateIndicator]);

  // Update indicator on mount to ensure initial position is set
  useEffect(() => {
    // Use multiple attempts to ensure refs are ready after mount
    const timeout1 = setTimeout(updateIndicator, 50);
    const timeout2 = setTimeout(updateIndicator, 150);
    const timeout3 = setTimeout(updateIndicator, 300);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [updateIndicator]);

  // Helper function to get preset ID from value
  const getPresetId = (value: any): number | null => {
    if (typeof value === "object" && value !== null && "id" in value) {
      return (value as any).id;
    }
    if (typeof value === "number") {
      return value;
    }
    if (typeof value === "string") {
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  };

  // Check if there are any changes in preferences
  const hasPreferencesChanges =
    preferences?.some((pref) => {
      const currentValue = localValues[pref.key];
      if (currentValue === undefined) return false;

      const originalValue = pref.value;
      
      // Handle preset objects (compare by ID) - dev and prod presets
      if (pref.key === "landing_page_preset_number" || pref.key === "landing_page_preset_prod") {
        const currentId = getPresetId(currentValue);
        const originalId = getPresetId(originalValue);
        return currentId !== originalId;
      }
      
      if (typeof originalValue === "number") {
        return Number(currentValue) !== originalValue;
      }
      if (typeof originalValue === "boolean") {
        return Boolean(currentValue) !== originalValue;
      }
      if (pref.key === "featured_album_id") {
        const processedCurrent = currentValue === "" || currentValue === null ? null : currentValue;
        const processedOriginal = originalValue === null || originalValue === "null" ? null : originalValue;
        return processedCurrent !== processedOriginal;
      }
      return currentValue !== originalValue;
    }) ?? false;

  const hasChanges = hasPreferencesChanges || (carouselSaveRef?.hasChanges ?? false);

  const handleSaveAll = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    const savePromises: Promise<any>[] = [];

    try {
      if (hasPreferencesChanges && preferences) {
        const updates: { key: string; value: any }[] = [];

        preferences.forEach((pref) => {
          const currentValue = localValues[pref.key];
          if (currentValue === undefined) return;

          let processedValue: any = currentValue;
          
          // Handle preset objects - keep as object (both dev and prod)
          if (pref.key === "landing_page_preset_number" || pref.key === "landing_page_preset_prod") {
            // If it's already an object, validate and use it directly
            if (typeof currentValue === "object" && currentValue !== null && "id" in currentValue) {
              // Ensure all required fields are present
              const preset = currentValue as any;
              if (
                typeof preset.id === "number" &&
                typeof preset.name === "string" &&
                typeof preset.primary === "string" &&
                typeof preset.secondary === "string" &&
                typeof preset.accent === "string"
              ) {
                processedValue = {
                  id: preset.id,
                  name: preset.name,
                  primary: preset.primary,
                  secondary: preset.secondary,
                  accent: preset.accent,
                };
              } else {
                console.error("[PreferencesSettings] Invalid preset object structure:", preset);
                // Don't save invalid preset objects - skip this preference
                return;
              }
            } else if (typeof currentValue === "number") {
              // If it's a number (backward compat), we can't convert it here without file system access
              // This should not happen with new presets
              console.warn("[PreferencesSettings] Preset value is a number, not an object:", currentValue);
              processedValue = currentValue;
            } else {
              console.error("[PreferencesSettings] Unexpected preset value type:", typeof currentValue, currentValue);
              // Don't save invalid preset values - skip this preference
              return;
            }
          } else if (typeof pref.value === "number") {
            processedValue =
              typeof currentValue === "string" &&
              !isNaN(Number(currentValue)) &&
              currentValue.trim() !== ""
                ? Number(currentValue)
                : currentValue;
          } else if (typeof pref.value === "boolean") {
            processedValue = Boolean(currentValue);
          } else if (pref.key === "featured_album_id") {
            processedValue = currentValue === "" || currentValue === null ? null : currentValue;
          }

          const originalValue = pref.value;
          const hasChanged =
            processedValue === null
              ? originalValue !== null && originalValue !== "null"
              : processedValue !== originalValue;

          if (hasChanged) {
            updates.push({ key: pref.key, value: processedValue });
          }
        });

        if (updates.length > 0) {
          savePromises.push(updateMutation.mutateAsync(updates));
        }
      }

      if (carouselSaveRef?.hasChanges) {
        savePromises.push(carouselSaveRef.save());
      }

      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        toast.success("All changes saved successfully");
        queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
        queryClient.invalidateQueries({ queryKey: ["hero-carousel-images"] });
      }
    } catch (error: any) {
      console.error("Error saving changes:", error);
      toast.error(error.message || "Failed to save some changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter and sort preferences by category
  const eventsPreferences =
    preferences
      ?.filter((p) => p.category === "events")
      .sort((a, b) => getPreferenceSortOrder(a.key, "events") - getPreferenceSortOrder(b.key, "events")) || [];
  const albumsPreferences =
    preferences
      ?.filter((p) => p.category === "albums")
      .sort((a, b) => getPreferenceSortOrder(a.key, "albums") - getPreferenceSortOrder(b.key, "albums")) || [];
  const updatesPreferences =
    preferences
      ?.filter((p) => p.category === "updates")
      .sort((a, b) => getPreferenceSortOrder(a.key, "updates") - getPreferenceSortOrder(b.key, "updates")) || [];
  const generalPreferences =
    preferences
      ?.filter((p) => p.category === "general")
      .sort((a, b) => getPreferenceSortOrder(a.key, "general") - getPreferenceSortOrder(b.key, "general")) || [];
  const griffithPreferences =
    preferences
      ?.filter((p) => p.category === "griffith")
      .sort((a, b) => getPreferenceSortOrder(a.key, "griffith") - getPreferenceSortOrder(b.key, "griffith")) || [];
  const featurePreferences =
    preferences
      ?.filter((p) => p.category === "feature")
      .sort((a, b) => getPreferenceSortOrder(a.key, "feature") - getPreferenceSortOrder(b.key, "feature")) || [];

  // Build sections array for order manager
  const getSectionData = () => {
    const sections = [
      {
        id: "events",
        name: "Events",
        orderKey: "events_section_order",
        showKey: "events_section_show",
      },
      {
        id: "albums",
        name: "Albums",
        orderKey: "albums_section_order",
        showKey: "albums_section_show",
      },
      {
        id: "griffith",
        name: "Griffith",
        orderKey: "griffith_section_order",
        showKey: "griffith_section_show",
      },
      {
        id: "feature",
        name: "Feature",
        orderKey: "feature_section_order",
        showKey: "feature_section_show",
      },
      {
        id: "updates",
        name: "Updates",
        orderKey: "updates_section_order",
        showKey: "updates_section_show",
      },
    ];

    return sections.map((section) => {
      const orderValue = getPreferenceValue(section.orderKey);
      const showValue = getPreferenceValue(section.showKey);
      return {
        id: section.id,
        name: section.name,
        order: typeof orderValue === "number" ? orderValue : Number(orderValue) || 1,
        show: showValue === true || showValue === "true",
        orderKey: section.orderKey,
        showKey: section.showKey,
      };
    });
  };

  const handleSectionOrderChange = (updatedSections: any[]) => {
    updatedSections.forEach((section) => {
      handleValueChange(section.orderKey, section.order);
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
          <div
            className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
          <CardHeader className="relative">
            <Skeleton className="h-8 w-48" />
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
          style={{ animationDelay: "300ms" }}
        />

        <CardHeader className="relative">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Landing Page Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border mb-6 relative">
              <TabsList className="inline-flex h-auto p-0 bg-transparent gap-0 relative">
                <div
                  className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300 ease-in-out"
                  style={{
                    left: `${indicatorStyle.left}px`,
                    width: `${indicatorStyle.width}px`,
                  }}
                />
                <TabsTrigger
                  ref={layoutTabRef}
                  value="layout"
                  className={cn(
                    "flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300",
                    "hover:text-foreground hover:bg-transparent",
                    "data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  )}
                >
                  <FontAwesomeIcon
                    icon={activeTab === "layout" ? faRectangleListSolid : faRectangleList}
                    className="h-4 w-4 transition-all duration-300"
                  />
                  Layout
                </TabsTrigger>
                <TabsTrigger
                  ref={mediaTabRef}
                  value="media"
                  className={cn(
                    "flex items-center gap-2 rounded-none border-b-2 border-transparent bg-transparent px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300",
                    "hover:text-foreground hover:bg-transparent",
                    "data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  )}
                >
                  <FontAwesomeIcon
                    icon={activeTab === "media" ? faImageSolid : faImage}
                    className="h-4 w-4 transition-all duration-300"
                  />
                  Media
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="layout" className="space-y-8 mt-0">
              <AnimatePresence mode="wait">
                {activeTab === "layout" && (
                  <motion.div
                    className="space-y-6"
                    key="layout"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <GeneralSection
                      preferences={generalPreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      getSectionData={getSectionData}
                      handleSectionOrderChange={handleSectionOrderChange}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />

                    <FeatureSection
                      preferences={featurePreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />

                    <EventsSection
                      preferences={eventsPreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />

                    <AlbumsSection
                      preferences={albumsPreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />

                    <GriffithSection
                      preferences={griffithPreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />

                    <UpdatesSection
                      preferences={updatesPreferences}
                      getPreferenceValue={getPreferenceValue}
                      handleValueChange={handleValueChange}
                      updateMutation={updateMutation}
                      albums={albums}
                      albumsLoading={albumsLoading}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-0">
              <AnimatePresence mode="wait">
                {activeTab === "media" && (
                  <motion.div
                    key="media"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    <HeroCarouselSettings onSaveRef={setCarouselSaveRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sticky Bottom Bar - Only shows when there are changes */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg"
          >
            <div className="max-w-[1400px] mx-auto px-4 lg:pl-64 py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="font-medium">Unsaved changes</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {hasPreferencesChanges && carouselSaveRef?.hasChanges 
                      ? "Multiple changes" 
                      : hasPreferencesChanges 
                      ? "Settings changed" 
                      : "Media changed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    disabled={isSaving}
                  >
                    Discard
                  </Button>
                  <Button onClick={handleSaveAll} disabled={isSaving} size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save All Changes
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
