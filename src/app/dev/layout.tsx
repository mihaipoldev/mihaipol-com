import type { ReactNode } from "react";

import RouteBasedLayout from "@/components/landing/layout/RouteBasedLayout";
import { getSitePreferencePreset } from "@/features/settings/data";
import { getPresetById } from "@/lib/landing-page-presets-server";

type DevLayoutProps = {
  children: ReactNode;
};

export default async function DevLayout({ children }: DevLayoutProps) {
  // Get default preset (ID 19) from JSON file
  const defaultPreset = getPresetById(19) || getPresetById(1) || { id: 19, name: "Deep Teal Studio", primary: "180 55% 38%", secondary: "200 18% 40%", accent: "160 40% 45%" };
  
  // Get preset from database (handles both object and number formats)
  const landingPagePreset = await getSitePreferencePreset("landing_page_preset_number", defaultPreset);
  
  // Extract ID from preset object for PageLayout component
  const presetId = landingPagePreset.id;

  return <RouteBasedLayout landingPagePreset={presetId}>{children}</RouteBasedLayout>;
}
