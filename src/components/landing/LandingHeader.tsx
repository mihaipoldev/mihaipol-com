"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Events", target: "events" },
  { label: "Discography", target: "albums" },
  { label: "Griffith", target: "griffith" },
  { label: "Updates", target: "updates" },
  { label: "Contact", target: "contact" },
];

export default function LandingHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollListenersAttached = useRef(false);

  // Determine active section based on pathname for slug pages and list pages
  useEffect(() => {
    if (!pathname) return;

    // Check if we're on a slug page or list page and set active section accordingly
    if (pathname.startsWith("/dev/events")) {
      setActiveSection("events");
      return;
    }
    if (pathname.startsWith("/dev/updates")) {
      setActiveSection("updates");
      return;
    }
    if (pathname.startsWith("/dev/albums")) {
      setActiveSection("albums");
      return;
    }

    // For homepage, reset to null to allow scroll-based detection
    if (pathname === "/dev") {
      setActiveSection(null);
    }
  }, [pathname]);

  // Initialize viewport height
  useEffect(() => {
    const updateViewportHeight = () => {
      setViewportHeight(window.innerHeight);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight, { passive: true });

    return () => window.removeEventListener("resize", updateViewportHeight);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || 0;
      setScrollY(scrollY);
      setScrolled(scrollY > 50);
    };
    // Initial call
    handleScroll();
    // Also call after a small delay to ensure window is ready
    const timeoutId = setTimeout(handleScroll, 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    // Skip scroll-based detection if we're on a list page or slug page
    if (
      pathname &&
      pathname !== "/dev" &&
      (pathname.startsWith("/dev/events") ||
        pathname.startsWith("/dev/updates") ||
        pathname.startsWith("/dev/albums"))
    ) {
      // Clean up if we had listeners attached
      if (scrollListenersAttached.current) {
        scrollListenersAttached.current = false;
      }
      return;
    }

    // Prevent double-attaching listeners (React StrictMode runs effects twice in dev)
    if (scrollListenersAttached.current) {
      return;
    }

    const updateActiveSection = () => {
      // Get current scroll position - try multiple sources
      const scrollY =
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;

      // Get the first section (events) to check if we're in hero
      const firstSection = document.getElementById("events");

      if (!firstSection) {
        return;
      }

      const firstSectionTop = firstSection.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight || 0;

      // Check if we're near the bottom of the page or footer is visible
      const footer = document.getElementById("contact");

      // Calculate distance from bottom
      const scrollPosition = scrollY + viewportHeight;
      const distanceFromBottom = documentHeight - scrollPosition;

      // If we're above the first section (in hero), no section should be active
      if (firstSectionTop > viewportHeight * 0.4) {
        setActiveSection(null);
        return;
      }

      // Find which section is currently most visible in the viewport
      let activeTarget: string | null = null;
      let maxVisibility = 0;

      navLinks.forEach((link) => {
        // Skip contact as we handle it separately
        if (link.target === "contact") return;

        const el = document.getElementById(link.target);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const viewportTop = 0;
        const viewportBottom = viewportHeight;

        // Calculate how much of the section is visible in the upper part of viewport
        const sectionTop = Math.max(rect.top, viewportTop);
        const sectionBottom = Math.min(rect.bottom, viewportHeight * 0.6); // Only consider upper 60% of viewport

        if (sectionBottom > sectionTop) {
          const visibleHeight = sectionBottom - sectionTop;
          const visibility = visibleHeight / Math.min(rect.height, viewportHeight * 0.6);

          if (visibility > maxVisibility && rect.top < viewportHeight * 0.5) {
            maxVisibility = visibility;
            activeTarget = link.target;
          }
        }
      });

      // FINAL CHECK: Activate contact when we're at the bottom of the page
      // Priority: If we're truly at the bottom, show Contact
      if (footer) {
        const footerRect = footer.getBoundingClientRect();

        // Check if we're at the bottom of the page (within 200px for better detection)
        const isAtBottom = distanceFromBottom <= 200;

        // Footer is visible if any part is in viewport
        const footerIsVisible = footerRect.top < viewportHeight && footerRect.bottom > 0;

        // Activate contact if we're at the bottom AND footer is visible
        // This will override other sections when we're truly at the bottom
        if (isAtBottom && footerIsVisible) {
          activeTarget = "contact";
        }
      }

      // Use functional setState to avoid stale closure issues
      setActiveSection((prevActive) => {
        return activeTarget;
      });
    };

    // Check on scroll
    const handleScroll = () => {
      updateActiveSection();
    };

    // Initial check
    updateActiveSection();

    // Add scroll listeners
    window.addEventListener("scroll", handleScroll, { passive: true, capture: false });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    document.documentElement.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    scrollListenersAttached.current = true;

    return () => {
      window.removeEventListener("scroll", handleScroll, {
        capture: false,
      } as EventListenerOptions);
      document.removeEventListener("scroll", handleScroll, {
        capture: true,
      } as EventListenerOptions);
      document.documentElement.removeEventListener("scroll", handleScroll, {
        capture: true,
      } as EventListenerOptions);
      scrollListenersAttached.current = false;
    };
  }, [pathname]);

  const handleNavigation = (target: string) => {
    // If we're on a list page or slug page, navigate to homepage with hash
    if (
      pathname &&
      pathname !== "/dev" &&
      (pathname.startsWith("/dev/events") ||
        pathname.startsWith("/dev/updates") ||
        pathname.startsWith("/dev/albums"))
    ) {
      window.location.href = `/dev#${target}`;
      return;
    }

    // Otherwise, smooth scroll to section
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate if we're on hero section for white text
  const isLandingPage = pathname === "/dev";
  const scrollThreshold = viewportHeight > 0 ? Math.min(400, viewportHeight * 0.8) : 400;
  const isOnHero = isLandingPage && (viewportHeight === 0 || scrollY < scrollThreshold);

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pointer-events-none"
        style={{
          background: "transparent",
        }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between pointer-events-auto">
          <Link
            href="/dev"
            className="text-2xl md:text-3xl font-bold uppercase tracking-wider transition-all duration-500 relative group flex items-center gap-3 cursor-pointer"
            style={{
              fontFamily: "var(--font-family-heading, var(--font-geist-sans))",
              color: isOnHero ? "#ffffff" : undefined,
              display: "flex",
              backgroundColor: "transparent",
            }}
          >
            <img
              src="/icon.svg"
              alt=""
              className="w-8 h-8 md:w-8 md:h-8 flex-shrink-0"
              style={{
                filter: isOnHero ? "brightness(0) invert(1)" : undefined,
              }}
            />
            <span
              className="relative z-10 block"
              style={{
                color: isOnHero ? "#ffffff" : undefined,
              }}
            >
              Mihai Pol
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = activeSection === link.target;
              const baseColor = isOnHero
                ? isActive
                  ? "#ffffff"
                  : "rgba(255, 255, 255, 0.7)"
                : undefined;

              return (
                <Button
                  key={link.target}
                  variant="ghost"
                  size="sm"
                  className="relative text-md font-semibold tracking-wide uppercase transition-colors duration-300 bg-transparent shadow-none hover:bg-transparent px-0 group cursor-pointer"
                  style={{
                    color: baseColor,
                    backgroundColor: "transparent",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    if (baseColor) {
                      e.currentTarget.style.color = baseColor;
                    } else {
                      e.currentTarget.style.color = "";
                    }
                  }}
                  onClick={() => handleNavigation(link.target)}
                >
                  <span className="relative pb-1">
                    {link.label}
                    <span
                      className={cn(
                        "absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-white/50 transition-all duration-300",
                        isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                      )}
                    />
                  </span>
                </Button>
              );
            })}
          </nav>
        </div>
      </header>
    </>
  );
}
