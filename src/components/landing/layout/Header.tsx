"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Events", target: "events" },
  { label: "Discography", target: "albums" },
  { label: "Feature", target: "feature" },
  { label: "Updates", target: "updates" },
  { label: "Contact", target: "contact" },
];

export default function Header() {
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
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
          setScrollY(currentScrollY);
          setScrolled(currentScrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    // Initial call
    handleScroll();
    // Also call after a small delay to ensure window is ready
    const timeoutId = setTimeout(handleScroll, 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("scroll", handleScroll);
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
  
  // Use state value (which is updated by scroll listener)
  // Fallback to window.scrollY if state hasn't updated yet
  const currentScrollY = scrollY > 0 ? scrollY : (typeof window !== 'undefined' ? window.scrollY : 0);
  
  // Get current viewport height - use state if available, otherwise get from window
  const currentViewportHeight = viewportHeight > 0 
    ? viewportHeight 
    : (typeof window !== 'undefined' ? window.innerHeight : 800);
  
  const heroHeight = currentViewportHeight;
  const scrollThreshold = heroHeight;
  const isOnHero = isLandingPage && currentScrollY < scrollThreshold;

  // Calculate background opacity based on scroll through hero section
  // Start completely transparent at top of hero (scrollY = 0)
  // Gradually fade in as we scroll through hero to bottom of hero (heroHeight)
  // After hero, maintain full opacity
  let heroScrollProgress = 0;
  
  if (isLandingPage && heroHeight > 0) {
    // Calculate progress: 0 at top, 1 at bottom of hero
    heroScrollProgress = Math.min(1, Math.max(0, currentScrollY / heroHeight));
  } else if (!isLandingPage) {
    // For non-landing pages, use simple scroll-based fade
    heroScrollProgress = Math.min(1, Math.max(0, currentScrollY / 300));
  }
  
  // Start at 0 opacity at top, reach 0.95 at bottom of hero
  const bgOpacity = heroScrollProgress * 0.95;
  // Start at 0 blur at top, reach 20px at bottom of hero
  const blurAmount = heroScrollProgress * 20;

  // Debug: Log values to console
  useEffect(() => {
    if (isLandingPage) {
      console.log('Header values:', {
        scrollY,
        currentScrollY,
        viewportHeight,
        heroHeight,
        heroScrollProgress: heroScrollProgress.toFixed(3),
        bgOpacity: bgOpacity.toFixed(3),
        blurAmount: blurAmount.toFixed(2),
        pathname
      });
    }
  }, [scrollY, currentScrollY, viewportHeight, isLandingPage, pathname]);

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: 1,
          backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          backdropFilter: blurAmount > 0 ? `blur(${blurAmount}px)` : 'none',
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        data-scroll-y={currentScrollY}
        data-bg-opacity={bgOpacity}
        data-hero-progress={heroScrollProgress}
        data-is-landing={isLandingPage}
        data-viewport-height={currentViewportHeight}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-4 flex items-center justify-between pointer-events-auto">
          <Link
            href="/dev"
            className="text-2xl md:text-3xl font-bold uppercase tracking-wider transition-all duration-500 relative group flex items-center gap-3 cursor-pointer"
            style={{
              fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))",
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
                    fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))",
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
                    <motion.span
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-white/50"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ 
                        opacity: isActive ? 1 : 0, 
                        y: isActive ? 0 : 4 
                      }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </span>
                </Button>
              );
            })}
          </nav>
        </div>
      </motion.header>
    </>
  );
}
