"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Events", target: "events" },
  { label: "Discography", target: "albums" },
  { label: "Feature", target: "feature" },
  { label: "Updates", target: "updates" },
  { label: "Contact", target: "contact" },
];

export default function Header() {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const scrollListenersAttached = useRef(false);

  // Determine active section based on pathname for slug pages and list pages
  useEffect(() => {
    if (!pathname) return;

    if (pathname.startsWith("/events")) {
      setActiveSection("events");
      return;
    }
    if (pathname.startsWith("/updates")) {
      setActiveSection("updates");
      return;
    }
    if (pathname.startsWith("/albums")) {
      setActiveSection("albums");
      return;
    }

    if (pathname === "/") {
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
          // html has overflow:hidden, body is the scroll container
          const currentScrollY = document.body.scrollTop || window.scrollY || 0;
          setScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    handleScroll();
    const timeoutId = setTimeout(handleScroll, 100);
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timeoutId);
      document.body.removeEventListener("scroll", handleScroll);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    if (
      pathname &&
      pathname !== "/" &&
      (pathname.startsWith("/events") ||
        pathname.startsWith("/updates") ||
        pathname.startsWith("/albums"))
    ) {
      if (scrollListenersAttached.current) {
        scrollListenersAttached.current = false;
      }
      return;
    }

    if (scrollListenersAttached.current) {
      return;
    }

    const updateActiveSection = () => {
      const scrollY =
        document.body.scrollTop ||
        window.scrollY ||
        window.pageYOffset ||
        document.documentElement.scrollTop ||
        0;

      const firstSection = document.getElementById("events");
      if (!firstSection) return;

      const firstSectionTop = firstSection.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const documentHeight =
        document.documentElement.scrollHeight || document.body.scrollHeight || 0;

      const footer = document.getElementById("contact");
      const scrollPosition = scrollY + viewportHeight;
      const distanceFromBottom = documentHeight - scrollPosition;

      if (firstSectionTop > viewportHeight * 0.4) {
        setActiveSection(null);
        return;
      }

      let activeTarget: string | null = null;
      let maxVisibility = 0;

      navLinks.forEach((link) => {
        if (link.target === "contact") return;

        const el = document.getElementById(link.target);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const sectionTop = Math.max(rect.top, 0);
        const sectionBottom = Math.min(rect.bottom, viewportHeight * 0.6);

        if (sectionBottom > sectionTop) {
          const visibleHeight = sectionBottom - sectionTop;
          const visibility = visibleHeight / Math.min(rect.height, viewportHeight * 0.6);

          if (visibility > maxVisibility && rect.top < viewportHeight * 0.5) {
            maxVisibility = visibility;
            activeTarget = link.target;
          }
        }
      });

      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const isAtBottom = distanceFromBottom <= 200;
        const footerIsVisible = footerRect.top < viewportHeight && footerRect.bottom > 0;

        if (isAtBottom && footerIsVisible) {
          activeTarget = "contact";
        }
      }

      setActiveSection(() => activeTarget);
    };

    const handleScroll = () => updateActiveSection();

    updateActiveSection();

    window.addEventListener("scroll", handleScroll, { passive: true, capture: false });
    document.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    document.body.addEventListener("scroll", handleScroll, { passive: true });
    document.documentElement.addEventListener("scroll", handleScroll, {
      passive: true,
      capture: true,
    });

    scrollListenersAttached.current = true;

    return () => {
      window.removeEventListener("scroll", handleScroll, { capture: false } as EventListenerOptions);
      document.removeEventListener("scroll", handleScroll, { capture: true } as EventListenerOptions);
      document.body.removeEventListener("scroll", handleScroll);
      document.documentElement.removeEventListener("scroll", handleScroll, {
        capture: true,
      } as EventListenerOptions);
      scrollListenersAttached.current = false;
    };
  }, [pathname]);

  const handleNavigation = (target: string) => {
    if (
      pathname &&
      pathname !== "/" &&
      (pathname.startsWith("/events") ||
        pathname.startsWith("/updates") ||
        pathname.startsWith("/albums"))
    ) {
      window.location.href = `/#${target}`;
      return;
    }

    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Calculate if we're on hero section for white text
  const isLandingPage = pathname === "/";
  const currentScrollY = scrollY;
  const currentViewportHeight = viewportHeight || 800;

  const heroHeight = currentViewportHeight;
  const isOnHero = isLandingPage && currentScrollY < heroHeight;

  // Scroll-driven background: transparent at top, solid by 40% of hero
  let heroScrollProgress = 0;

  if (isLandingPage && heroHeight > 0) {
    heroScrollProgress = Math.min(1, Math.max(0, currentScrollY / (heroHeight * 0.4)));
  } else if (!isLandingPage) {
    heroScrollProgress = Math.min(1, Math.max(0, currentScrollY / 200));
  }

  // Ease-out curve for a more natural feel
  const eased = 1 - Math.pow(1 - heroScrollProgress, 3);
  const bgOpacity = eased * 0.95;
  const isCompact = currentScrollY > 60;

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 pointer-events-none transition-colors duration-300 ease-out"
        style={{
          backgroundColor: `hsl(var(--background) / ${bgOpacity})`,
          backdropFilter: bgOpacity > 0.1 ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: bgOpacity > 0.1 ? 'blur(12px)' : 'none',
        }}
      >
        <div
          className={`max-w-[1200px] mx-auto px-6 md:px-8 flex items-center justify-between pointer-events-auto transition-[padding] duration-300 ease-out ${isCompact ? 'py-3' : 'py-4'}`}
        >
          <Link
            href="/"
            className={`text-2xl md:text-3xl font-bold uppercase tracking-wider transition-colors duration-500 relative group flex items-center gap-3 cursor-pointer bg-transparent ${isOnHero ? 'text-white' : ''}`}
            style={{ fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))" }}
          >
            <img
              src="/icon.svg"
              alt=""
              className={`w-8 h-8 flex-shrink-0 transition-[filter] duration-500 ${isOnHero ? 'brightness-0 invert' : ''}`}
            />
            <span className={`relative z-10 block ${isOnHero ? 'text-white' : ''}`}>
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
                  className="relative text-md font-semibold tracking-wide uppercase transition-colors duration-300 bg-transparent! shadow-none hover:bg-transparent px-0 group cursor-pointer"
                  style={{ color: baseColor, fontFamily: "var(--font-roboto, var(--font-family-heading, var(--font-geist-sans)))" }}
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
                      className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded-full bg-white/50 transition-[opacity,transform] duration-300"
                      style={{
                        opacity: isActive ? 1 : 0,
                        transform: isActive ? "translateY(0)" : "translateY(4px)",
                      }}
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
