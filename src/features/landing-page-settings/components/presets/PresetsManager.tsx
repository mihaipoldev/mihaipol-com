"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PresetList } from "./PresetList";
import { Skeleton } from "@/components/ui/skeleton";
import { Palette } from "lucide-react";
import type { LandingPagePreset } from "@/lib/landing-page-presets";

export function PresetsManager() {
  const [presets, setPresets] = useState<LandingPagePreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPresets = async () => {
    try {
      const response = await fetch("/api/admin/settings/presets");
      if (!response.ok) {
        throw new Error("Failed to fetch presets");
      }
      const data = await response.json();
      setPresets(data.data || []);
    } catch (error) {
      console.error("Error fetching presets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresets();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <CardTitle>Landing Page Presets</CardTitle>
        </div>
        <CardDescription>
          Create and manage color presets for your landing page. All presets are stored here and can be edited or deleted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PresetList presets={presets} onRefresh={fetchPresets} />
      </CardContent>
    </Card>
  );
}
