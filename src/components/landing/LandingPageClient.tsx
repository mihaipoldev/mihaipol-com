"use client";

import React, { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import LandingHeroSection from "./sections/LandingHeroSection";
import LandingFeatureMusicSection from "./sections/LandingFeatureMusicSection";
import LandingAlbumsSection from "./sections/LandingAlbumsSection";
import LandingEventsSection from "./sections/LandingEventsSection";
import LandingGriffithSection from "./sections/LandingGriffithSection";
import LandingGriffithAlbumsSection from "./sections/LandingGriffithAlbumsSection";
import LandingUpdatesSection from "./sections/LandingUpdatesSection";
import type { LandingAlbum, LandingEvent, LandingUpdate } from "./types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type LandingPageClientProps = {
  events: LandingEvent[];
  albums: LandingAlbum[];
  updates: LandingUpdate[];
  featuredAlbum: LandingAlbum | null;
  heroImage: string;
  heroImages: string[];
  griffithLabelSlug: string;
  showPastStrikethrough: boolean;
  albumsHomepageColumns: number;
  updatesHomepageColumns: number;
  griffithAlbums: LandingAlbum[];
  griffithAlbumsHomepageColumns: number;
  // Section visibility
  eventsSectionShow: boolean;
  albumsSectionShow: boolean;
  griffithSectionShow: boolean;
  featureSectionShow: boolean;
  updatesSectionShow: boolean;
  // Section order
  eventsSectionOrder: number;
  albumsSectionOrder: number;
  griffithSectionOrder: number;
  featureSectionOrder: number;
  updatesSectionOrder: number;
};

export default function LandingPageClient({
  events,
  albums,
  updates,
  featuredAlbum,
  heroImage,
  heroImages,
  griffithLabelSlug,
  showPastStrikethrough,
  albumsHomepageColumns,
  updatesHomepageColumns,
  griffithAlbums,
  griffithAlbumsHomepageColumns,
  eventsSectionShow,
  albumsSectionShow,
  griffithSectionShow,
  featureSectionShow,
  updatesSectionShow,
  eventsSectionOrder,
  albumsSectionOrder,
  griffithSectionOrder,
  featureSectionOrder,
  updatesSectionOrder,
}: LandingPageClientProps) {
  const featured = featuredAlbum ?? albums[0] ?? null;
  const pathname = usePathname();

  // Prevent scroll to top on mount if we have a hash - run immediately before paint
  useLayoutEffect(() => {
    if (pathname !== "/dev") return;

    // If we have a hash, try to scroll immediately
    const hash = window.location.hash;
    if (hash) {
      const sectionId = hash.substring(1);
      const section = document.getElementById(sectionId);
      if (section) {
        // Section exists, scroll immediately without smooth behavior
        const headerHeight = 64;
        const rect = section.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const sectionTop = rect.top + scrollTop - headerHeight;
        window.scrollTo({ top: Math.max(0, sectionTop), behavior: "auto" });
      }
    }
  }, [pathname]);

  // Restore scroll position when coming back from navigation
  useEffect(() => {
    if (pathname !== "/dev") return;

    const scrollToSection = (sectionId: string, immediate = false) => {
      const section = document.getElementById(sectionId);
      if (section) {
        const headerHeight = 64;
        const rect = section.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const sectionTop = rect.top + scrollTop - headerHeight;

        // Ensure we don't scroll to negative values
        const targetTop = Math.max(0, sectionTop);

        window.scrollTo({
          top: targetTop,
          behavior: immediate ? "auto" : "smooth",
        });

        // Update URL hash after scrolling
        if (!window.location.hash || window.location.hash !== `#${sectionId}`) {
          window.history.replaceState(null, "", `#${sectionId}`);
        }
        return true;
      }
      return false;
    };

    // Function to try scrolling with retries
    const tryScrollToSection = (sectionId: string, maxAttempts = 30, immediate = false) => {
      let attempts = 0;
      const tryScroll = () => {
        attempts++;
        const section = document.getElementById(sectionId);
        if (section) {
          // Check if the section is actually rendered and has dimensions
          const rect = section.getBoundingClientRect();
          if (rect.height > 0 || attempts >= maxAttempts) {
            scrollToSection(sectionId, immediate);
            return;
          }
        }
        if (attempts < maxAttempts) {
          // Try again after a short delay
          setTimeout(() => {
            requestAnimationFrame(tryScroll);
          }, 50);
        }
      };
      // Start immediately or after a delay
      if (immediate) {
        requestAnimationFrame(() => {
          requestAnimationFrame(tryScroll);
        });
      } else {
        // Start after a delay to ensure page is rendered
        // Also wait for window load if page is still loading
        if (document.readyState === "complete") {
          setTimeout(() => {
            requestAnimationFrame(tryScroll);
          }, 100);
        } else {
          window.addEventListener(
            "load",
            () => {
              setTimeout(() => {
                requestAnimationFrame(tryScroll);
              }, 100);
            },
            { once: true }
          );
        }
      }
    };

    // Check if we have a stored section to scroll to (from "View all" links)
    const storedSection = sessionStorage.getItem("landingPageScrollSection");
    if (storedSection) {
      // Clear it so it only happens once
      sessionStorage.removeItem("landingPageScrollSection");

      // Clear any existing hash in the URL to prevent browser from scrolling to it
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      // Wait for the page to render, then scroll to the section
      tryScrollToSection(storedSection);
    } else {
      // If there's a hash in the URL (from direct navigation or browser back), scroll to it
      const hash = window.location.hash;
      if (hash) {
        const sectionId = hash.substring(1); // Remove the #
        // Try immediately first, then with retries if needed
        const section = document.getElementById(sectionId);
        if (section && section.getBoundingClientRect().height > 0) {
          // Section is ready, scroll immediately
          scrollToSection(sectionId, true);
        } else {
          // Section not ready yet, use retry mechanism
          tryScrollToSection(sectionId, 30, true);
        }
      }
    }

    // Handle hash changes (e.g., when clicking nav links)
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const sectionId = hash.substring(1);
        // Small delay to ensure any previous scroll has finished
        setTimeout(() => {
          scrollToSection(sectionId);
        }, 100);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname]);

  // Define sections with their visibility, order, and render functions
  type SectionConfig = {
    id: string;
    order: number;
    show: boolean;
    render: () => React.ReactNode;
  };

  const sections: SectionConfig[] = [
    {
      id: "events",
      order: eventsSectionOrder,
      show: eventsSectionShow,
      render: () => (
      <LandingEventsSection events={events} showPastStrikethrough={showPastStrikethrough} />
      ),
    },
    {
      id: "albums",
      order: albumsSectionOrder,
      show: albumsSectionShow,
      render: () => (
      <LandingAlbumsSection
        albums={albums}
        fallbackImage={FALLBACK_IMAGE}
        columns={albumsHomepageColumns as 3 | 4 | 5}
      />
      ),
    },
    {
      id: "griffith-albums",
      order: griffithSectionOrder,
      show: griffithSectionShow,
      render: () => (
        <LandingGriffithAlbumsSection
          albums={griffithAlbums}
          fallbackImage={FALLBACK_IMAGE}
          columns={griffithAlbumsHomepageColumns as 3 | 4 | 5}
          griffithLabelSlug={griffithLabelSlug}
        />
      ),
    },
    {
      id: "griffith",
      order: featureSectionOrder,
      show: featureSectionShow,
      render: () => (
      <LandingGriffithSection
        featuredAlbum={featuredAlbum}
        fallbackImage={FALLBACK_IMAGE}
        griffithLabelSlug={griffithLabelSlug}
      />
      ),
    },
    {
      id: "updates",
      order: updatesSectionOrder,
      show: updatesSectionShow,
      render: () => (
      <LandingUpdatesSection
        updates={updates}
        fallbackImage={FALLBACK_IMAGE}
        variant="compact"
        columns={updatesHomepageColumns as 3 | 4 | 5}
      />
      ),
    },
  ];

  // Filter visible sections and sort by order
  const visibleSections = sections
    .filter((section) => section.show)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <LandingHeroSection
        heroImage={heroImage}
        heroImages={heroImages}
        featuredAlbum={featured}
        events={events}
        albums={albums}
      />

      {visibleSections.map((section) => (
        <React.Fragment key={section.id}>{section.render()}</React.Fragment>
      ))}
    </>
  );
}
