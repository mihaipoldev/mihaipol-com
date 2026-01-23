"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { PageLayout } from "./PageLayout";
import { SmartLinksLayout } from "@/features/smart-links/layout/SmartLinksLayout";

type RouteBasedLayoutProps = {
  children: ReactNode;
  landingPagePreset?: number;
};

/**
 * Route-based layout that conditionally renders either:
 * - PageLayout for most pages (with header, footer, background)
 * - SmartLinksLayout for album smart links pages (minimal, just children)
 */
export default function RouteBasedLayout({ children, landingPagePreset = 19 }: RouteBasedLayoutProps) {
  const pathname = usePathname();
  // Check for album smart links pages (e.g., /dev/albums/[slug] or /albums/[slug])
  // This will work both with /dev/ prefix (current) and without (future)
  const isAlbumSlugPage = pathname?.match(/\/albums\/[^/]+$/) !== null;

  // For album smart links pages, use minimal layout
  if (isAlbumSlugPage) {
    return <SmartLinksLayout>{children}</SmartLinksLayout>;
  }

  // For all other pages, use full landing page layout
  return <PageLayout landingPagePreset={landingPagePreset}>{children}</PageLayout>;
}
