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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Skip scroll-based detection if we're on a list page or slug page
    if (pathname && pathname !== "/dev" && (pathname.startsWith("/dev/events") || pathname.startsWith("/dev/updates") || pathname.startsWith("/dev/albums"))) {
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
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      
      // Get the first section (events) to check if we're in hero
      const firstSection = document.getElementById("events");
      
      if (!firstSection) {
        return;
      }

      const firstSectionTop = firstSection.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;

      // Check if we're near the bottom of the page or footer is visible
      const footer = document.getElementById("contact");
      const isScrollable = documentHeight > viewportHeight + 100;
      
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

      // FINAL CHECK: Override with contact if footer is visible or approaching
      // This is the MOST RELIABLE check - just look at footer position
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        // Footer is visible if ANY part is in viewport
        const footerIsInViewport = footerRect.top < viewportHeight && footerRect.bottom > 0;
        // Footer is approaching if it's within 80% of viewport from top
        const footerIsApproaching = footerRect.top <= viewportHeight * 0.8;
        
        // If footer is visible OR approaching, FORCE contact to be active
        if (footerIsInViewport || footerIsApproaching) {
          console.log("[LandingHeader] ✅ FOOTER DETECTED - Setting contact:", {
            footerTop: footerRect.top,
            footerBottom: footerRect.bottom,
            viewportHeight,
            footerIsInViewport,
            footerIsApproaching
          });
          activeTarget = "contact";
        }
      }

      // Use functional setState to avoid stale closure issues
      setActiveSection((prevActive) => {
        if (activeTarget !== prevActive) {
          console.log(`[LandingHeader] 🎯 Setting activeSection: "${prevActive}" -> "${activeTarget}"`);
        }
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
    document.documentElement.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    
    scrollListenersAttached.current = true;

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: false } as EventListenerOptions);
      document.removeEventListener("scroll", handleScroll, { capture: true } as EventListenerOptions);
      document.documentElement.removeEventListener("scroll", handleScroll, { capture: true } as EventListenerOptions);
      scrollListenersAttached.current = false;
    };
  }, [pathname]);

  const handleNavigation = (target: string) => {
    // If we're on a list page or slug page, navigate to homepage with hash
    if (pathname && pathname !== "/dev" && (pathname.startsWith("/dev/events") || pathname.startsWith("/dev/updates") || pathname.startsWith("/dev/albums"))) {
      window.location.href = `/dev#${target}`;
      return;
    }

    // Otherwise, smooth scroll to section
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-transparent">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          href="/dev"
          className="text-2xl md:text-3xl font-bold text-foreground hover:opacity-80 transition-opacity uppercase tracking-wider"
          style={{ fontFamily: "var(--font-family-heading, var(--font-geist-sans))" }}
        >
          Mihai Pol
        </Link>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Button
                key={link.target}
                variant="ghost"
                size="sm"
                className={cn(
                  "relative text-md font-semibold tracking-wide uppercase transition-colors bg-transparent shadow-none hover:bg-transparent px-0",
                  activeSection === link.target 
                    ? "text-foreground hover:text-foreground" 
                    : "text-foreground/70 hover:text-foreground"
                )}
                onClick={() => handleNavigation(link.target)}
              >
                <span className="relative pb-1">
                  {link.label}
                  <span
                    className={cn(
                      "absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-foreground transition-all duration-300",
                      activeSection === link.target ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
                    )}
                  />
                </span>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
