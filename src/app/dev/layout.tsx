import type { ReactNode } from "react";

import ConditionalDevLayout from "@/components/layout/ConditionalDevLayout";
import { getSitePreferenceNumber } from "@/features/settings/data";

type DevLayoutProps = {
  children: ReactNode;
};

export default async function DevLayout({ children }: DevLayoutProps) {
  const landingPagePreset = await getSitePreferenceNumber("landing_page_preset_number", 19);
  // Ensure it's between 1 and 22
  const presetNumber = Math.max(1, Math.min(22, Math.round(landingPagePreset)));

  return <ConditionalDevLayout landingPagePreset={presetNumber}>{children}</ConditionalDevLayout>;
}
