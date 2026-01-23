"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dev/events", label: "Events", sectionId: "events" },
  { href: "/dev/albums", label: "Albums", sectionId: "albums" },
  { href: "/dev/updates", label: "Updates", sectionId: "updates" },
  { href: "#contact", label: "Contact", isHash: true, sectionId: "contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const isLandingPage = pathname === "/dev";

  // Initialize viewport height and track scroll
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
      const scrollY = window.scrollY;
      setScrollY(scrollY);

      if (!isLandingPage) return;

      const headerOffset = 100;

      // Get all sections with their positions, ordered by their position in the DOM
      const sections = navLinks
        .filter((link) => link.sectionId)
        .map((link) => {
          const element = document.getElementById(link.sectionId!);
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          const top = rect.top + scrollY;
          return {
            id: link.sectionId!,
            top,
            bottom: top + rect.height,
          };
        })
        .filter(Boolean) as Array<{ id: string; top: number; bottom: number }>;

      if (sections.length === 0) return;

      // Sort sections by their top position
      sections.sort((a, b) => a.top - b.top);

      // Find the section we're currently in or just passed
      let activeSection: string | null = null;
      const currentPosition = scrollY + headerOffset;

      // Check each section to see if we're in it or just passed it
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];

        // If we're within this section
        if (currentPosition >= section.top && currentPosition < section.bottom) {
          activeSection = section.id;
          break;
        }

        // If we've passed this section but haven't reached the next one
        if (i < sections.length - 1) {
          const nextSection = sections[i + 1];
          if (currentPosition >= section.bottom && currentPosition < nextSection.top) {
            // We're between sections, use the one we just passed
            activeSection = section.id;
            break;
          }
        } else {
          // Last section - if we're past it, use it
          if (currentPosition >= section.top) {
            activeSection = section.id;
            break;
          }
        }
      }

      // Fallback to first section if at top
      if (!activeSection) {
        activeSection = sections[0].id;
      }

      setActiveSection(activeSection);
    };

    handleScroll(); // Initial check
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLandingPage]);

  // Calculate logo color based on scroll position
  // On hero section (top): white text for visibility on dark images
  // After scrolling past hero: use mix-blend-difference for dynamic inversion
  const isOnHero = isLandingPage && viewportHeight > 0 && scrollY < viewportHeight * 0.8;
  const shouldInvert = isLandingPage && viewportHeight > 0 && scrollY > viewportHeight * 0.8;

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-10 md:px-16 lg:px-28">
        {/* Logo on the left */}
        <Link
          href="/dev"
          className={cn(
            "text-2xl sm:text-3xl font-bold tracking-widest uppercase transition-all duration-500 relative group",
            isOnHero
              ? "text-white hover:text-white/80"
              : shouldInvert
                ? "text-background mix-blend-difference"
                : "text-foreground hover:text-foreground/80"
          )}
        >
          <span className="relative z-10">Mihai Pol</span>
          <span
            className={cn(
              "absolute bottom-0 left-0 h-px transition-all duration-500 ease-out",
              isOnHero
                ? "w-0 bg-white/30 group-hover:w-full"
                : shouldInvert
                  ? "w-full bg-background/30"
                  : "w-0 bg-foreground/30 group-hover:w-full"
            )}
          ></span>
        </Link>
        {/* Centered menu items */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 md:gap-10 text-base font-bold">
          {navLinks.map((link) => {
            // On landing page, use scroll spy. Otherwise use pathname matching
            let isActive: boolean;
            if (isLandingPage && link.sectionId) {
              isActive = activeSection === link.sectionId;
            } else {
              isActive = link.isHash
                ? false
                : pathname === link.href ||
                  (pathname?.startsWith(link.href + "/") && pathname !== link.href);
            }

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (isLandingPage && link.sectionId) {
                e.preventDefault();
                const section = document.getElementById(link.sectionId);
                if (section) {
                  const headerHeight = 64;
                  const sectionTop =
                    section.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                  window.scrollTo({ top: sectionTop, behavior: "smooth" });
                  // Update URL hash without triggering scroll
                  window.history.replaceState(null, "", `#${link.sectionId}`);
                }
              } else if (link.isHash) {
                e.preventDefault();
                const footer = document.getElementById("contact");
                if (footer) {
                  footer.scrollIntoView({ behavior: "smooth", block: "start" });
                  // Update URL hash without triggering scroll
                  window.history.replaceState(null, "", "#contact");
                }
              }
            };

            return (
              <Link
                key={link.href}
                href={isLandingPage && link.sectionId ? `#${link.sectionId}` : link.href}
                onClick={handleClick}
                className={cn(
                  "transition-all duration-300 relative group py-2",
                  isOnHero
                    ? isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : isActive
                      ? "text-foreground"
                      : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px transition-all duration-300 ease-out",
                    isOnHero ? "bg-white/50" : "bg-foreground/50",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
