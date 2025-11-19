"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Calendar, Music, Newspaper, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { SitePreference } from "@/features/settings/types";

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

export function PreferencesSettings() {
  const queryClient = useQueryClient();
  const [localValues, setLocalValues] = useState<PreferenceValue>({});

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["site-preferences"],
    queryFn: fetchPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { key: string; value: any }[]) => updatePreferencesBatch(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
      toast.success("Preferences updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences");
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

  const handleValueChange = (key: string, value: any) => {
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const getPreferenceValue = (key: string): any => {
    return localValues[key] ?? preferences?.find((p) => p.key === key)?.value;
  };

  // Check if there are any changes
  const hasChanges =
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
      return currentValue !== originalValue;
    }) ?? false;

  const handleSaveAll = () => {
    if (!preferences) return;

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
      }

      // Only include if value has changed
      if (processedValue !== pref.value) {
        updates.push({ key: pref.key, value: processedValue });
      }
    });

    if (updates.length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const eventsPreferences = preferences?.filter((p) => p.category === "events") || [];
  const albumsPreferences = preferences?.filter((p) => p.category === "albums") || [];
  const updatesPreferences = preferences?.filter((p) => p.category === "updates") || [];

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
          <CardDescription>
            Configure how content is displayed on the homepage and throughout the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative">
          {/* Events Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Events</h3>
            </div>

            {eventsPreferences.map((pref) => {
              const value = getPreferenceValue(pref.key);
              const isBoolean =
                typeof pref.value === "boolean" || pref.value === "true" || pref.value === "false";

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
                      <Switch
                        id={pref.key}
                        checked={value === true || value === "true"}
                        onCheckedChange={(checked) => {
                          handleValueChange(pref.key, checked);
                        }}
                        disabled={updateMutation.isPending}
                      />
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
                                ? 3
                                : undefined
                        }
                        max={
                          pref.key.includes("limit")
                            ? 20
                            : pref.key.includes("days")
                              ? 365
                              : pref.key.includes("columns")
                                ? 5
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
            <div className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Albums</h3>
            </div>

            {albumsPreferences.map((pref) => {
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
                      min={pref.key.includes("columns") ? 3 : 1}
                      max={pref.key.includes("columns") ? 5 : 20}
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

          {/* Updates Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Updates</h3>
            </div>

            {updatesPreferences.map((pref) => {
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
                      min={pref.key.includes("columns") ? 3 : 1}
                      max={pref.key.includes("columns") ? 5 : 20}
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

          {/* Save All Button */}
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveAll}
              disabled={!hasChanges || updateMutation.isPending}
              size="lg"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save All Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
