"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Calendar, Music, Newspaper, Loader2, Palette, Disc3, Star } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRectangleList, faImage } from "@fortawesome/free-regular-svg-icons";
import { faRectangleList as faRectangleListSolid, faImage as faImageSolid } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { SitePreference } from "@/features/settings/types";
import { HeroCarouselSettings, type HeroCarouselSaveRef } from "@/components/admin/HeroCarouselSettings";
import { SectionOrderManager } from "./SectionOrderManager";

type PreferenceValue = {
  [key: string]: any;
};

async function fetchPreferences(): Promise<SitePreference[]> {
  const response = await fetch("/api/admin/settings/preferences");
  if (!response.ok) {
    throw new Error("Failed to fetch preferences");
  }
  return response.json();
}

async function updatePreference(key: string, value: any): Promise<void> {
  const response = await fetch("/api/admin/settings/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preference");
  }
}

async function updatePreferencesBatch(updates: { key: string; value: any }[]): Promise<void> {
  // Update all preferences in parallel
  await Promise.all(updates.map(({ key, value }) => updatePreference(key, value)));
}

type Album = {
  id: string;
  title: string;
  slug: string;
  release_date: string | null;
  publish_status: string;
  labelName: string | null;
  cover_image_url: string | null;
};

async function fetchAlbums(): Promise<Album[]> {
  const response = await fetch("/api/admin/albums");
  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }
  return response.json();
}

export function PreferencesSettings() {
  const queryClient = useQueryClient();
  const [localValues, setLocalValues] = useState<PreferenceValue>({});
  const [carouselSaveRef, setCarouselSaveRef] = useState<HeroCarouselSaveRef | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("layout");
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const layoutTabRef = useRef<HTMLButtonElement>(null);
  const mediaTabRef = useRef<HTMLButtonElement>(null);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["site-preferences"],
    queryFn: fetchPreferences,
  });

  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["albums-list"],
    queryFn: fetchAlbums,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { key: string; value: any }[]) => updatePreferencesBatch(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
    },
    onError: (error: Error) => {
      throw error; // Re-throw so handleSaveAll can handle it
    },
  });

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

  // Update indicator position when active tab changes
  useEffect(() => {
    const updateIndicator = () => {
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
    };

    // Small delay to ensure DOM is updated
    const timeoutId = setTimeout(updateIndicator, 0);
    
    // Update on resize
    window.addEventListener("resize", updateIndicator);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", updateIndicator);
    };
  }, [activeTab]);

  const handleValueChange = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const getPreferenceValue = (key: string): any => {
    return localValues[key] ?? preferences?.find((p) => p.key === key)?.value;
  };

  // Check if there are any changes in preferences
  const hasPreferencesChanges =
    preferences?.some((pref) => {
      const currentValue = localValues[pref.key];
      if (currentValue === undefined) return false;

      // Compare values (handle type conversion for numbers and booleans)
      const originalValue = pref.value;
      if (typeof originalValue === "number") {
        return Number(currentValue) !== originalValue;
      }
      if (typeof originalValue === "boolean") {
        return Boolean(currentValue) !== originalValue;
      }
      // Handle null values for featured_album_id
      if (pref.key === "featured_album_id") {
        const processedCurrent = currentValue === "" || currentValue === null ? null : currentValue;
        const processedOriginal = originalValue === null || originalValue === "null" ? null : originalValue;
        return processedCurrent !== processedOriginal;
      }
      return currentValue !== originalValue;
    }) ?? false;

  // Check if there are changes in carousel or preferences
  const hasChanges = hasPreferencesChanges || (carouselSaveRef?.hasChanges ?? false);

  const handleSaveAll = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    const savePromises: Promise<any>[] = [];

    try {
      // Save preferences if there are changes
      if (hasPreferencesChanges && preferences) {
    const updates: { key: string; value: any }[] = [];

    preferences.forEach((pref) => {
      const currentValue = localValues[pref.key];
      if (currentValue === undefined) return;

      // Convert string numbers to actual numbers
      let processedValue: any = currentValue;
      if (typeof pref.value === "number") {
        processedValue =
          typeof currentValue === "string" &&
          !isNaN(Number(currentValue)) &&
          currentValue.trim() !== ""
            ? Number(currentValue)
            : currentValue;
      } else if (typeof pref.value === "boolean") {
        processedValue = Boolean(currentValue);
          } else if (pref.key === "featured_album_id") {
            // Handle featured album: empty string or null means use default
            processedValue = currentValue === "" || currentValue === null ? null : currentValue;
      }

      // Only include if value has changed
          // For null values, compare properly (null vs "null" string)
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

      // Save carousel changes if there are any
      if (carouselSaveRef?.hasChanges) {
        savePromises.push(carouselSaveRef.save());
      }

      // Execute all saves
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
        toast.success("All changes saved successfully");
        // Invalidate queries to refresh data
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

  // Define sort order for preferences within each category
  const getPreferenceSortOrder = (key: string, category: string): number => {
    const orderMaps: Record<string, Record<string, number>> = {
      events: {
        events_homepage_limit: 1,
        events_homepage_days_back: 2,
        events_show_past_strikethrough: 3,
      },
      albums: {
        albums_homepage_limit: 1,
        albums_homepage_columns: 2,
        albums_page_columns: 3,
      },
      updates: {
        updates_homepage_limit: 1,
        updates_homepage_columns: 2,
        updates_page_columns: 3,
      },
      general: {
        landing_page_preset_number: 1,
      },
      griffith: {
        griffith_albums_homepage_limit: 1,
        griffith_albums_homepage_columns: 2,
      },
      feature: {
        featured_album_id: 1,
      },
    };

    return orderMaps[category]?.[key] ?? 999; // Unknown preferences go to the end
  };

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
    // Update local values for all section orders
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
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

        {/* Sparkle decorations */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full blur-sm animate-pulse" />
        <div
          className="absolute top-12 right-12 w-1.5 h-1.5 bg-primary/30 rounded-full blur-sm animate-pulse"
          style={{ animationDelay: "300ms" }}
        />

        <CardHeader className="relative">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" />
            Content Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border mb-6 relative">
              <TabsList className="inline-flex h-auto p-0 bg-transparent gap-0 relative">
                {/* Sliding indicator */}
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
                    key="layout"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
          {/* General Section */}
          {generalPreferences.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">General</h3>
              </div>

              {generalPreferences.map((pref) => {
                const value = getPreferenceValue(pref.key);

                return (
                  <div
                    key={pref.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                  >
                    <div className="flex-1">
                      <Label htmlFor={pref.key} className="text-sm font-medium">
                        {pref.description || pref.key}
                      </Label>
                      {pref.description && (
                        <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id={pref.key}
                        type="number"
                        min={pref.key.includes("preset") ? 1 : undefined}
                        max={pref.key.includes("preset") ? 22 : undefined}
                        value={value ?? ""}
                        onChange={(e) => handleValueChange(pref.key, e.target.value)}
                        className="w-24"
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}

              {/* Section Order Manager */}
              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
              >
                <div className="flex-1">
                  <Label className="text-sm font-medium">
                    Section Display Order
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">Reorder sections on the homepage</p>
                </div>
                <div className="flex items-center gap-3">
                  <SectionOrderManager
                    sections={getSectionData()}
                    onOrderChange={handleSectionOrderChange}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Feature Section */}
          {featurePreferences.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Feature</h3>
                </div>
                {(() => {
                  const showPref = featurePreferences.find((p) => p.key === "feature_section_show");
                  if (!showPref) return null;
                  const showValue = getPreferenceValue("feature_section_show");
                  return (
                    <Switch
                      checked={showValue === true || showValue === "true"}
                      onCheckedChange={(checked) => {
                        handleValueChange("feature_section_show", checked);
                      }}
                      disabled={updateMutation.isPending}
                    />
                  );
                })()}
              </div>

              {featurePreferences.filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show")).map((pref) => {
                const value = getPreferenceValue(pref.key);
                const isFeaturedAlbum = pref.key === "featured_album_id";

                return (
                  <div
                    key={pref.key}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                  >
                    <div className="flex-1">
                      <Label htmlFor={pref.key} className="text-sm font-medium">
                        {pref.description || pref.key}
                      </Label>
                      {pref.description && (
                        <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {isFeaturedAlbum ? (
                        <Select
                          value={
                            value && value !== "null" && value !== null
                              ? String(value)
                              : "__default__"
                          }
                          onValueChange={(newValue) => {
                            handleValueChange(pref.key, newValue === "__default__" ? null : newValue);
                          }}
                          disabled={updateMutation.isPending || albumsLoading}
                        >
                          <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Use default (Griffith album)" />
                          </SelectTrigger>
                          <SelectContent align="end" className="w-[300px]">
                            <SelectItem value="__default__" className="overflow-hidden min-w-0">
                              <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
                                <Music className="h-4 w-4 shrink-0" />
                                <span className="truncate min-w-0" style={{ maxWidth: "calc(300px - 3rem)" }}>
                                  Use default (Griffith album)
                                </span>
                              </div>
                            </SelectItem>
                            {albums
                              ?.sort((a, b) => {
                                // Albums without dates come first, sorted by name
                                if (!a.release_date && !b.release_date) {
                                  return a.title.localeCompare(b.title);
                                }
                                if (!a.release_date) return -1;
                                if (!b.release_date) return 1;
                                // Albums with dates sorted by date descending
                                return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
                              })
                              .map((album) => (
                                <SelectItem key={album.id} value={album.id} className="overflow-hidden min-w-0">
                                  <div className="flex items-center gap-2 min-w-0 max-w-full overflow-hidden">
                                    {album.cover_image_url ? (
                                      <img
                                        src={album.cover_image_url}
                                        alt={album.title}
                                        className="h-4 w-4 shrink-0 rounded object-cover"
                                      />
                                    ) : (
                                      <Music className="h-4 w-4 shrink-0" />
                                    )}
                                    <span className="truncate min-w-0" style={{ maxWidth: "calc(300px - 3rem)" }}>
                                      {album.title}
                                      {album.labelName && ` (${album.labelName})`}
                                      {album.publish_status !== "published" && ` [${album.publish_status}]`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={pref.key}
                          type="number"
                          min={pref.key.includes("preset") ? 1 : undefined}
                          max={pref.key.includes("preset") ? 22 : undefined}
                          value={value ?? ""}
                          onChange={(e) => handleValueChange(pref.key, e.target.value)}
                          className="w-24"
                          disabled={updateMutation.isPending}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Events Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Events</h3>
              </div>
              {(() => {
                const showPref = eventsPreferences.find((p) => p.key === "events_section_show");
                if (!showPref) return null;
                const showValue = getPreferenceValue("events_section_show");
                return (
                  <Switch
                    checked={showValue === true || showValue === "true"}
                    onCheckedChange={(checked) => {
                      handleValueChange("events_section_show", checked);
                    }}
                    disabled={updateMutation.isPending}
                  />
                );
              })()}
            </div>

            {eventsPreferences.filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show")).map((pref) => {
              const value = getPreferenceValue(pref.key);
              const isBoolean =
                typeof pref.value === "boolean" ||
                pref.value === "true" ||
                pref.value === "false";

              return (
                <div
                  key={pref.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                >
                  <div className="flex-1">
                    <Label htmlFor={pref.key} className="text-sm font-medium">
                      {pref.description || pref.key}
                    </Label>
                    {pref.description && (
                      <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isBoolean ? (
                      <Select
                        value={value === true || value === "true" ? "yes" : "no"}
                        onValueChange={(newValue) => {
                          handleValueChange(pref.key, newValue === "yes");
                        }}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={pref.key}
                        type="number"
                        min={
                          pref.key.includes("limit")
                            ? 1
                            : pref.key.includes("days")
                              ? 1
                              : pref.key.includes("columns")
                                ? 1
                                : undefined
                        }
                        max={
                          pref.key.includes("limit")
                            ? 20
                            : pref.key.includes("days")
                              ? 365
                              : pref.key.includes("columns")
                                ? 7
                                : undefined
                        }
                        value={value ?? ""}
                        onChange={(e) => handleValueChange(pref.key, e.target.value)}
                        className="w-24"
                        disabled={updateMutation.isPending}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Albums Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Albums</h3>
              </div>
              {(() => {
                const showPref = albumsPreferences.find((p) => p.key === "albums_section_show");
                if (!showPref) return null;
                const showValue = getPreferenceValue("albums_section_show");
                return (
                  <Switch
                    checked={showValue === true || showValue === "true"}
                    onCheckedChange={(checked) => {
                      handleValueChange("albums_section_show", checked);
                    }}
                    disabled={updateMutation.isPending}
                  />
                );
              })()}
            </div>

            {albumsPreferences.filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show")).map((pref) => {
              const value = getPreferenceValue(pref.key);

              return (
                <div
                  key={pref.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                >
                  <div className="flex-1">
                    <Label htmlFor={pref.key} className="text-sm font-medium">
                      {pref.description || pref.key}
                    </Label>
                    {pref.description && (
                      <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id={pref.key}
                      type="number"
                      min={pref.key.includes("columns") ? 1 : 1}
                      max={pref.key.includes("columns") ? 7 : 20}
                      value={value ?? ""}
                      onChange={(e) => handleValueChange(pref.key, e.target.value)}
                      className="w-24"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Griffith Section */}
          {griffithPreferences.length > 0 && (
          <div className="space-y-4">
              <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                  <Disc3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Griffith</h3>
                </div>
                {(() => {
                  const showPref = griffithPreferences.find((p) => p.key === "griffith_section_show");
                  if (!showPref) return null;
                  const showValue = getPreferenceValue("griffith_section_show");
                  return (
                    <Switch
                      checked={showValue === true || showValue === "true"}
                      onCheckedChange={(checked) => {
                        handleValueChange("griffith_section_show", checked);
                      }}
                      disabled={updateMutation.isPending}
                    />
                  );
                })()}
            </div>

              {griffithPreferences.filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show")).map((pref) => {
              const value = getPreferenceValue(pref.key);

              return (
                <div
                  key={pref.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                >
                  <div className="flex-1">
                    <Label htmlFor={pref.key} className="text-sm font-medium">
                      {pref.description || pref.key}
                    </Label>
                    {pref.description && (
                      <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id={pref.key}
                      type="number"
                      min={pref.key.includes("columns") ? 1 : 1}
                      max={pref.key.includes("columns") ? 7 : 20}
                        value={value ?? ""}
                        onChange={(e) => handleValueChange(pref.key, e.target.value)}
                        className="w-24"
                        disabled={updateMutation.isPending}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Updates Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Updates</h3>
              </div>
              {(() => {
                const showPref = updatesPreferences.find((p) => p.key === "updates_section_show");
                if (!showPref) return null;
                const showValue = getPreferenceValue("updates_section_show");
                return (
                  <Switch
                    checked={showValue === true || showValue === "true"}
                    onCheckedChange={(checked) => {
                      handleValueChange("updates_section_show", checked);
                    }}
                    disabled={updateMutation.isPending}
                  />
                );
              })()}
            </div>

            {updatesPreferences.filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show")).map((pref) => {
              const value = getPreferenceValue(pref.key);

              return (
                <div
                  key={pref.key}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2"
                >
                  <div className="flex-1">
                    <Label htmlFor={pref.key} className="text-sm font-medium">
                      {pref.description || pref.key}
                    </Label>
                    {pref.description && (
                      <p className="text-xs text-muted-foreground mt-1">{pref.key}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id={pref.key}
                      type="number"
                      min={
                        pref.key.includes("columns")
                          ? 1
                          : 1
                      }
                      max={
                        pref.key.includes("columns")
                          ? 7
                          : 20
                      }
                      value={value ?? ""}
                      onChange={(e) => handleValueChange(pref.key, e.target.value)}
                      className="w-24"
                      disabled={updateMutation.isPending}
                    />
                  </div>
                </div>
              );
            })}
          </div>
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

      {/* Save All Button - Outside Card */}
      <div className="flex justify-end">
            <Button
              onClick={handleSaveAll}
          disabled={!hasChanges || isSaving}
              size="lg"
            >
          {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save All Changes"
              )}
            </Button>
          </div>
    </div>
  );
}
