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
  const isLandingPage = pathname === "/dev";

  useEffect(() => {
    if (!isLandingPage) return;

    const handleScroll = () => {
      const headerOffset = 100;
      const scrollY = window.scrollY;

      // Get all sections with their positions, ordered by their position in the DOM
      const sections = navLinks
        .filter(link => link.sectionId)
        .map(link => {
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

  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 relative">
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent"></div>
      <div className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between px-10 md:px-16 lg:px-28">
        {/* Logo on the left */}
        <Link
          href="/dev"
          className="text-2xl sm:text-3xl font-bold tracking-widest uppercase text-foreground hover:text-foreground/80 transition-colors duration-300 relative group"
        >
          <span className="relative z-10">Mihai Pol</span>
          <span className="absolute bottom-0 left-0 w-0 h-px bg-foreground/30 group-hover:w-full transition-all duration-500 ease-out"></span>
        </Link>
        {/* Centered menu items */}
        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8 md:gap-10 text-base font-bold">
          {navLinks.map((link) => {
            // On landing page, use scroll spy. Otherwise use pathname matching
            let isActive: boolean;
            if (isLandingPage && link.sectionId) {
              isActive = activeSection === link.sectionId;
            } else {
              isActive = link.isHash ? false : (pathname === link.href || (pathname?.startsWith(link.href + "/") && pathname !== link.href));
            }

            const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              if (isLandingPage && link.sectionId) {
                e.preventDefault();
                const section = document.getElementById(link.sectionId);
                if (section) {
                  const headerHeight = 64;
                  const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                  window.scrollTo({ top: sectionTop, behavior: "smooth" });
                }
              } else if (link.isHash) {
              e.preventDefault();
              const footer = document.getElementById("contact");
              if (footer) {
                footer.scrollIntoView({ behavior: "smooth", block: "start" });
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
                  isActive
                    ? "text-foreground"
                    : "text-foreground/70 hover:text-foreground"
                )}
              >
                <span className="relative z-10">{link.label}</span>
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px bg-foreground/50 transition-all duration-300 ease-out",
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
