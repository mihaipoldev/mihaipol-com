"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faCompactDisc,
  faUsers,
  faCalendar,
  faTag,
  faRadio,
  faGear,
  faBars,
  faLink,
  faExternalLink,
  faNewspaper,
  faGlobe,
  faChevronDown,
  faChevronLeft,
  faMusic,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { UserMenu } from "./UserMenu";
import { getSidebarGradient, getSidebarAccentGradient } from "@/lib/gradient-presets";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePrimaryColor } from "@/hooks/use-primary-color";

const overviewItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: faChartLine,
  },
  {
    title: "Events",
    href: "/admin/events",
    icon: faCalendar,
  },
];

const updatesItem = {
  title: "Updates",
  href: "/admin/updates",
  icon: faNewspaper,
};

const musicItems = [
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: faChartLine,
  },
  {
    title: "Albums",
    href: "/admin/albums",
    icon: faCompactDisc,
  },
  {
    title: "Artists",
    href: "/admin/artists",
    icon: faUsers,
  },
  {
    title: "Labels",
    href: "/admin/labels",
    icon: faTag,
  },
  {
    title: "Platforms",
    href: "/admin/platforms",
    icon: faRadio,
  },
];

const smartLinksItems: Array<{ title: string; href: string; icon: any }> = [];

const settingsItems = [
  {
    title: "Settings",
    href: "/admin/settings",
    icon: faGear,
  },
];

function MusicCollapsible({
  onNavigate,
  isMobile = false,
}: {
  onNavigate?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const sidebarAccentGradient = getSidebarAccentGradient();
  const hoverGradientClasses = sidebarAccentGradient
    .split(" ")
    .map((cls) => `hover:${cls}`)
    .join(" ");

  const handleLinkClick = () => {
    onNavigate?.();
  };

  const isMusicActive =
    pathname.startsWith("/admin/analytics") ||
    pathname.startsWith("/admin/albums") ||
    pathname.startsWith("/admin/artists") ||
    pathname.startsWith("/admin/labels") ||
    pathname.startsWith("/admin/platforms");

  // Only render after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-expand if we're on a music-related page
  useEffect(() => {
    if (isMusicActive && !isOpen) {
      setIsOpen(true);
    }
  }, [isMusicActive, isOpen]);

  // Render a non-collapsible version during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        data-active={isMusicActive}
        className={cn(
          `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
          isMobile
            ? "py-3 text-[17px] h-12 gap-6 [&>svg]:size-5"
            : "py-2.5 text-[15px] h-10 gap-5 [&>svg]:size-4",
          "[&>svg]:shrink-0",
          "[&>span:last-child]:truncate",
          isMusicActive
            ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-8 pr-5" : "pl-7 pr-4"}`
            : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-5" : "px-4"}`
        )}
      >
        <FontAwesomeIcon icon={faMusic} />
        <span className="flex-1">Music</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={cn("transition-transform duration-200", isMobile ? "!w-3 !h-3" : "")}
          style={
            isMobile
              ? { fontSize: "0.625rem", width: "0.75rem", height: "0.75rem" }
              : { fontSize: "0.75rem", width: "0.75rem", height: "0.75rem" }
          }
        />
      </button>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          data-active={isMusicActive}
          className={cn(
            `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
            isMobile
              ? "py-3 text-[17px] h-12 gap-6 [&>svg]:size-5"
              : "py-2.5 text-[15px] h-10 gap-5 [&>svg]:size-4",
            "[&>svg]:shrink-0",
            "[&>span:last-child]:truncate",
            isMusicActive
              ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-8 pr-5" : "pl-7 pr-4"}`
              : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-5" : "px-4"}`
          )}
        >
          <FontAwesomeIcon icon={faMusic} />
          <span className="flex-1">Music</span>
          <FontAwesomeIcon
            icon={isOpen ? faChevronDown : faChevronLeft}
            className={cn("transition-transform duration-200", isMobile ? "!w-3 !h-3" : "")}
            style={
              isMobile
                ? { fontSize: "0.625rem", width: "0.75rem", height: "0.75rem" }
                : { fontSize: "0.75rem", width: "0.75rem", height: "0.75rem" }
            }
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className={cn("mt-0.5", isMobile && "mt-1")}>
        <div className={cn("flex flex-col gap-0.5", isMobile ? "pl-11" : "pl-9")}>
          {musicItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                data-active={isActive}
                className={cn(
                  `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
                  isMobile
                    ? "py-2.5 text-[16px] h-11 gap-4 [&>svg]:size-4"
                    : "py-2 text-[14px] h-9 gap-3 [&>svg]:size-3",
                  "[&>svg]:shrink-0",
                  "[&>span:last-child]:truncate",
                  isActive
                    ? `${getSidebarAccentGradient()} relative font-semibold hover:font-semibold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-6 pr-4" : "pl-5 pr-3"}`
                    : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-4" : "px-3"}`
                )}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarContent({
  onNavigate,
  isMobile = false,
}: {
  onNavigate?: () => void;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  // Use the hook directly to trigger re-render when color changes
  const { primaryColor } = usePrimaryColor();

  const sidebarAccentGradient = getSidebarAccentGradient();
  const hoverGradientClasses = sidebarAccentGradient
    .split(" ")
    .map((cls) => `hover:${cls}`)
    .join(" ");

  const handleLinkClick = () => {
    onNavigate?.();
  };

  return (
    <div className="flex h-full flex-col relative sidebar-sparkles">
      {/* Sparkles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="sparkle" style={{ top: "25%", left: "5%", animationDelay: "0s" }} />
        <div className="sparkle" style={{ top: "45%", left: "10%", animationDelay: "5s" }} />
        <div className="sparkle" style={{ top: "70%", left: "7%", animationDelay: "10s" }} />
        <div className="sparkle" style={{ top: "35%", left: "15%", animationDelay: "7s" }} />
      </div>
      {/* Logo/Brand */}
      <div
        className={cn(
          "flex items-center justify-between",
          isMobile ? "h-20 px-6 mt-2 mb-2" : "h-16 px-6 mt-2 mb-2"
        )}
      >
        <Link href="/admin" className="flex flex-col group">
          <span
            className={cn(
              "font-bold text-sidebar-foreground leading-tight uppercase tracking-tight transition-colors group-hover:text-primary",
              isMobile ? "text-2xl" : "text-2xl"
            )}
          >
            Mihai Pol
          </span>
          <span
            className={cn(
              "text-sidebar-foreground/60 leading-tight -mt-0.5 font-medium",
              isMobile ? "text-xs" : "text-xs"
            )}
          >
            Artist Portal
          </span>
        </Link>
        <Link href="/dev" target="_blank" rel="noopener noreferrer">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "rounded-full bg-primary/5 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:scale-105 transition-all duration-200 !shadow-none dark:!shadow-none hover:!shadow-none dark:hover:!shadow-none ring-0 focus-visible:ring-0 group/button flex-shrink-0",
              isMobile ? "h-12 w-12 !h-12 !w-12" : "h-9 w-9"
            )}
            style={
              isMobile
                ? { height: "3rem", width: "3rem", minHeight: "3rem", minWidth: "3rem" }
                : undefined
            }
            aria-label="Go to website"
          >
            <FontAwesomeIcon
              icon={faGlobe}
              className={cn(
                "transition-transform duration-200 group-hover/button:rotate-12",
                isMobile ? "h-7 w-7" : "h-6 w-6"
              )}
            />
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1", isMobile ? "space-y-9 px-6 py-7 pt-8" : "space-y-7 p-5 pt-6")}>
        {/* Overview Category */}
        <div className={cn("space-y-2.5", isMobile && "space-y-3 mt-0")}>
          <div
            className={cn(
              "font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1",
              isMobile ? "text-xs" : "text-xs px-3"
            )}
          >
            Overview
          </div>
          <div className="flex flex-col gap-0.5">
            {overviewItems.map((item) => {
              // For Dashboard, only match exactly /admin, not sub-routes
              // For other items, match the exact route or sub-routes
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  data-active={isActive}
                  className={cn(
                    `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
                    isMobile
                      ? "py-3 text-[17px] h-12 gap-6 [&>svg]:size-5"
                      : "py-2.5 text-[15px] h-10 gap-5 [&>svg]:size-4",
                    "[&>svg]:shrink-0",
                    "[&>span:last-child]:truncate",
                    isActive
                      ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-8 pr-5" : "pl-7 pr-4"}`
                      : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-5" : "px-4"}`
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
            <MusicCollapsible onNavigate={onNavigate} isMobile={isMobile} />
            <Link
              href={updatesItem.href}
              onClick={handleLinkClick}
              data-active={
                pathname === updatesItem.href || pathname.startsWith(updatesItem.href + "/")
              }
              className={cn(
                `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
                isMobile
                  ? "py-3 text-[17px] h-12 gap-6 [&>svg]:size-5"
                  : "py-2.5 text-[15px] h-10 gap-5 [&>svg]:size-4",
                "[&>svg]:shrink-0",
                "[&>span:last-child]:truncate",
                pathname === updatesItem.href || pathname.startsWith(updatesItem.href + "/")
                  ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-8 pr-5" : "pl-7 pr-4"}`
                  : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-5" : "px-4"}`
              )}
            >
              <FontAwesomeIcon icon={updatesItem.icon} />
              <span>{updatesItem.title}</span>
            </Link>
          </div>
        </div>

        {/* Settings Category */}
        <div className={cn("space-y-2.5", isMobile ? "space-y-3 mt-8" : "mt-0")}>
          <div
            className={cn(
              "font-semibold text-sidebar-foreground/50 uppercase tracking-wider mb-1",
              isMobile ? "text-xs" : "text-xs px-3"
            )}
          >
            Settings
          </div>
          <div className="flex flex-col gap-0.5">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  data-active={isActive}
                  className={cn(
                    `peer/menu-button flex w-full items-center overflow-hidden text-left font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary`,
                    isMobile
                      ? "py-3 text-[17px] h-12 gap-6 [&>svg]:size-5"
                      : "py-2.5 text-[15px] h-10 gap-1.5 [&>svg]:size-4",
                    "[&>svg]:shrink-0",
                    "[&>span:last-child]:truncate",
                    isActive
                      ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary rounded-r-lg rounded-l-none ${isMobile ? "pl-8 pr-5" : "pl-7 pr-4"}`
                      : `text-sidebar-muted-foreground rounded-lg ${isMobile ? "px-5" : "px-4"}`
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <UserMenu />
    </div>
  );
}

export function AdminSidebar() {
  return <SidebarContent />;
}

export function AdminSidebarMobile() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  // Use the hook directly to trigger re-render when color changes
  const { primaryColor } = usePrimaryColor();
  const [cssVars, setCssVars] = useState<Record<string, string>>({});

  // Update CSS variables when color changes or sheet opens
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    const vars = {
      "--brand-h":
        computedStyle.getPropertyValue("--brand-h").trim() ||
        root.style.getPropertyValue("--brand-h").trim(),
      "--brand-s":
        computedStyle.getPropertyValue("--brand-s").trim() ||
        root.style.getPropertyValue("--brand-s").trim(),
      "--brand-l":
        computedStyle.getPropertyValue("--brand-l").trim() ||
        root.style.getPropertyValue("--brand-l").trim(),
      "--primary":
        computedStyle.getPropertyValue("--primary").trim() ||
        root.style.getPropertyValue("--primary").trim(),
    };

    setCssVars(vars);

    // Also apply directly to SheetContent if it's open
    if (open) {
      const sheetContent = document.querySelector("[data-radix-dialog-content]") as HTMLElement;
      if (sheetContent) {
        Object.entries(vars).forEach(([key, value]) => {
          if (value) {
            sheetContent.style.setProperty(key, value, "important");
          }
        });
      }
    }
  }, [primaryColor, open]);

  // Recalculate gradient on each render to ensure it picks up CSS variable changes
  const sidebarGradient = getSidebarGradient();

  if (!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className={`w-[272px] p-0 ${sidebarGradient}`}
        hideCloseButton
        style={cssVars as React.CSSProperties}
      >
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <SidebarContent onNavigate={() => setOpen(false)} isMobile={true} />
      </SheetContent>
    </Sheet>
  );
}
