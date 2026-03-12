import type { ReactNode } from "react";

import RouteBasedLayout from "@/components/landing/layout/RouteBasedLayout";

type PublicLayoutProps = {
  children: ReactNode;
};

const ACTIVE_PRESET_ID = 19;

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <RouteBasedLayout landingPagePreset={ACTIVE_PRESET_ID}>{children}</RouteBasedLayout>;
}
