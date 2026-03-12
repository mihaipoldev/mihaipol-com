"use client";

import React, { useEffect, useLayoutEffect } from "react";
import { usePathname } from "next/navigation";
import HeroSection from "./sections/HeroSection";
import AlbumsSection from "./sections/AlbumsSection";
import EventsSection from "./sections/EventsSection";
import FeatureSection from "./sections/FeatureSection";
import GriffithAlbumsSection from "./sections/GriffithAlbumsSection";
import UpdatesSection from "./sections/UpdatesSection";
import type { LandingAlbum, LandingEvent, LandingUpdate } from "./types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type PageClientProps = {
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

export default function PageClient({
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
}: PageClientProps) {
  const featured = featuredAlbum ?? albums[0] ?? null;
  const pathname = usePathname();

  // Detect if this is a page refresh (not navigation)
  // Use a ref to track if this is the initial mount
  const isInitialMount = React.useRef(true);

  // Clean up sessionStorage on page refresh
  useLayoutEffect(() => {
    if (pathname !== "/dev") return;

    console.log("[ScrollRestore] useLayoutEffect - Initial cleanup check");
    console.log("[ScrollRestore] isInitialMount:", isInitialMount.current);
    
    // Check if this is a page refresh vs navigation
    // If _isNavigation flag doesn't exist, it's likely a refresh
    const isNavigation = sessionStorage.getItem("_isNavigation") === "true";
    const storedPosition = sessionStorage.getItem("updatesPageScrollPosition");
    
    console.log("[ScrollRestore] SessionStorage state:", {
      isNavigation,
      storedPosition,
      _restoringScroll: sessionStorage.getItem("_restoringScroll"),
      landingPageScrollSection: sessionStorage.getItem("landingPageScrollSection"),
      hash: window.location.hash,
    });
    
    if (!isNavigation && isInitialMount.current) {
      console.log("[ScrollRestore] Detected REFRESH - clearing all scroll data");
      // On refresh, clear all scroll-related sessionStorage
      sessionStorage.removeItem("updatesPageScrollPosition");
      sessionStorage.removeItem("_restoringScroll");
      sessionStorage.removeItem("landingPageScrollSection");
      sessionStorage.removeItem("_isNavigation");
      // Clear any hash from URL on refresh to start from top
      if (window.location.hash) {
        console.log("[ScrollRestore] Clearing hash from URL:", window.location.hash);
        window.history.replaceState(null, "", window.location.pathname);
      }
      isInitialMount.current = false;
      return;
    }

    isInitialMount.current = false;

    // Only scroll to hash if this is navigation (not refresh)
    if (isNavigation) {
      console.log("[ScrollRestore] Detected NAVIGATION - checking for hash");
      const hash = window.location.hash;
      if (hash) {
        console.log("[ScrollRestore] Found hash, scrolling to:", hash);
        const sectionId = hash.substring(1);
        const section = document.getElementById(sectionId);
        if (section) {
          // Section exists, scroll immediately without smooth behavior
          const headerHeight = 64;
          const rect = section.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const sectionTop = rect.top + scrollTop - headerHeight;
          window.scrollTo({ top: Math.max(0, sectionTop), behavior: "auto" });
          console.log("[ScrollRestore] Scrolled to section:", sectionId, "at position:", sectionTop);
        } else {
          console.log("[ScrollRestore] Section not found:", sectionId);
        }
      }
    }
  }, [pathname]);

  // Restore scroll position when coming back from navigation
  // Use useLayoutEffect to restore BEFORE paint to prevent Next.js scroll-to-top
  useLayoutEffect(() => {
    if (pathname !== "/dev") return;

    console.log("[ScrollRestore] useLayoutEffect - Scroll restoration check");
    
    // First, check if we have a stored scroll position from an update detail page
    const storedScrollPosition = sessionStorage.getItem("updatesPageScrollPosition");
    const isNavigation = sessionStorage.getItem("_isNavigation") === "true";
    
    console.log("[ScrollRestore] Restoration check:", {
      storedScrollPosition,
      isNavigation,
      hasBoth: storedScrollPosition && isNavigation,
    });
    
    // Only restore if we have both: stored position AND navigation flag
    // If flag doesn't exist, it's a refresh or stale data - don't restore
    if (storedScrollPosition && isNavigation) {
      const scrollY = parseInt(storedScrollPosition, 10);
      console.log("[ScrollRestore] Attempting to restore scroll to:", scrollY);
      
      if (!isNaN(scrollY) && scrollY > 0) {
        // Set a flag to prevent other scroll logic from interfering
        sessionStorage.setItem("_restoringScroll", "true");
        console.log("[ScrollRestore] Setting _restoringScroll flag");
        
        // Restore immediately before paint to prevent Next.js from scrolling to top
        // Use multiple requestAnimationFrame calls to ensure it happens after layout
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            console.log("[ScrollRestore] Executing scrollTo:", scrollY);
            window.scrollTo({
              top: scrollY,
              behavior: "auto", // Instant scroll
            });
            console.log("[ScrollRestore] Scroll executed, current scrollY:", window.scrollY);
            // Clear flags after a short delay to allow scroll to complete
            setTimeout(() => {
              sessionStorage.removeItem("updatesPageScrollPosition");
              sessionStorage.removeItem("_restoringScroll");
              sessionStorage.removeItem("_isNavigation");
              console.log("[ScrollRestore] Cleaned up sessionStorage");
            }, 100);
          });
        });
        
        // Don't proceed with section scrolling if we're restoring scroll position
        return;
      } else {
        console.log("[ScrollRestore] Invalid scroll position:", scrollY);
        // Clear invalid position
        sessionStorage.removeItem("updatesPageScrollPosition");
        sessionStorage.removeItem("_isNavigation");
      }
    } else if (storedScrollPosition && !isNavigation) {
      console.log("[ScrollRestore] Stale data detected (no navigation flag) - clearing");
      // Stale data from refresh - clear it
      sessionStorage.removeItem("updatesPageScrollPosition");
    } else {
      console.log("[ScrollRestore] No restoration needed:", {
        hasPosition: !!storedScrollPosition,
        isNavigation,
      });
    }
  }, [pathname]);

  // Restore scroll position when coming back from navigation (fallback)
  useEffect(() => {
    if (pathname !== "/dev") return;

    console.log("[ScrollRestore] useEffect - Fallback restoration check");
    
    // Check if we're already restoring (from useLayoutEffect)
    const isRestoring = sessionStorage.getItem("_restoringScroll");
    if (isRestoring) {
      console.log("[ScrollRestore] Already restoring in useLayoutEffect, skipping fallback");
      // Don't run fallback if useLayoutEffect is handling it
      return;
    }

    // Check if we have a stored scroll position (fallback in case useLayoutEffect didn't catch it)
    const storedScrollPosition = sessionStorage.getItem("updatesPageScrollPosition");
    const isNavigation = sessionStorage.getItem("_isNavigation") === "true";
    
    console.log("[ScrollRestore] Fallback check:", {
      storedScrollPosition,
      isNavigation,
      hasBoth: storedScrollPosition && isNavigation,
    });
    
    // Only restore if we have both: stored position AND navigation flag
    if (storedScrollPosition && isNavigation) {
      const scrollY = parseInt(storedScrollPosition, 10);
      console.log("[ScrollRestore] Fallback: Attempting to restore scroll to:", scrollY);
      
      if (!isNaN(scrollY) && scrollY > 0) {
        sessionStorage.setItem("_restoringScroll", "true");
        
        // Use a small delay to ensure content is rendered
        const timeoutId = setTimeout(() => {
          console.log("[ScrollRestore] Fallback: Executing scrollTo:", scrollY);
          window.scrollTo({
            top: scrollY,
            behavior: "auto",
          });
          console.log("[ScrollRestore] Fallback: Scroll executed, current scrollY:", window.scrollY);
          sessionStorage.removeItem("updatesPageScrollPosition");
          setTimeout(() => {
            sessionStorage.removeItem("_restoringScroll");
            sessionStorage.removeItem("_isNavigation");
            console.log("[ScrollRestore] Fallback: Cleaned up sessionStorage");
          }, 100);
        }, 50);

        // Don't proceed with section scrolling if we're restoring scroll position
        return () => clearTimeout(timeoutId);
      } else {
        console.log("[ScrollRestore] Fallback: Invalid scroll position:", scrollY);
        sessionStorage.removeItem("updatesPageScrollPosition");
        sessionStorage.removeItem("_isNavigation");
      }
    } else if (storedScrollPosition && !isNavigation) {
      console.log("[ScrollRestore] Fallback: Stale data detected - clearing");
      // Stale data from refresh - clear it
      sessionStorage.removeItem("updatesPageScrollPosition");
    }

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
    // Note: We already checked isRestoring at the beginning of this useEffect
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
      // Only scroll to hash if this is navigation (not refresh)
      // On refresh, we want to start from top, not scroll to hash
      const isNavigation = sessionStorage.getItem("_isNavigation") === "true";
      if (isNavigation) {
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
      <EventsSection events={events} showPastStrikethrough={showPastStrikethrough} />
      ),
    },
    {
      id: "albums",
      order: albumsSectionOrder,
      show: albumsSectionShow,
      render: () => (
      <AlbumsSection
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
        <GriffithAlbumsSection
          albums={griffithAlbums}
          fallbackImage={FALLBACK_IMAGE}
          columns={griffithAlbumsHomepageColumns as 3 | 4 | 5}
          griffithLabelSlug={griffithLabelSlug}
        />
      ),
    },
    {
      id: "feature",
      order: featureSectionOrder,
      show: featureSectionShow,
      render: () => (
      <FeatureSection
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
      <UpdatesSection
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
      <HeroSection
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
