"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { UserMenu } from "./UserMenu";
import { getSidebarGradient, getSidebarAccentGradient } from "@/lib/gradient-presets";

const overviewItems = [
  {
    title: "Dashboard",
    href: "/admin",
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
    title: "Events",
    href: "/admin/events",
    icon: faCalendar,
  },
  {
    title: "Labels",
    href: "/admin/labels",
    icon: faTag,
  },
  {
    title: "Updates",
    href: "/admin/updates",
    icon: faNewspaper,
  },
];

const smartLinksItems = [
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: faChartLine,
  },
  {
    title: "Platforms",
    href: "/admin/platforms",
    icon: faRadio,
  },
];

const settingsItems = [
  {
    title: "Settings",
    href: "/admin/settings",
    icon: faGear,
  },
  {
    title: "Performance Test",
    href: "/admin/test-performance",
    icon: faChartLine,
  },
];

function SidebarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarAccentGradient = getSidebarAccentGradient();
  const hoverGradientClasses = sidebarAccentGradient
    .split(" ")
    .map((cls) => `hover:${cls}`)
    .join(" ");

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
      <div className="flex h-16 items-center justify-between px-6 mt-2 mb-2">
        <Link href="/admin" className="flex flex-col group">
          <span className="text-2xl font-bold text-sidebar-foreground leading-tight uppercase tracking-tight transition-colors group-hover:text-primary">
            Mihai Pol
          </span>
          <span className="text-xs text-sidebar-foreground/60 leading-tight -mt-0.5 font-medium">
            Artist Portal
          </span>
        </Link>
        <Link href="/dev">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl bg-primary/5 text-primary border border-primary/20 hover:bg-primary/15 hover:border-primary/30 hover:scale-105 transition-all duration-200 !shadow-none dark:!shadow-none hover:!shadow-none dark:hover:!shadow-none ring-0 focus-visible:ring-0 group/button"
            aria-label="Go to website"
          >
            <FontAwesomeIcon
              icon={faGlobe}
              className="h-5 w-5 transition-transform duration-200 group-hover/button:rotate-12"
            />
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-7 p-5 pt-6">
        {/* Overview Category */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-1">
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
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    `peer/menu-button flex w-full items-center overflow-hidden rounded-lg px-4 py-2.5 text-left text-[15px] font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary h-10 gap-5`,
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate",
                    isActive
                      ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary`
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Smart Links Category */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-1">
            Smart Links
          </div>
          <div className="flex flex-col gap-0.5">
            {smartLinksItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    `peer/menu-button flex w-full items-center overflow-hidden rounded-lg px-4 py-2.5 text-left text-[15px] font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary h-10 gap-1.5`,
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate gap-5",
                    isActive
                      ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary`
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Category */}
        <div className="space-y-2.5">
          <div className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3 mb-1">
            Settings
          </div>
          <div className="flex flex-col gap-0.5">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    `peer/menu-button flex w-full items-center overflow-hidden rounded-lg px-4 py-2.5 text-left text-[15px] font-medium outline-none ring-sidebar-ring transition-all duration-200 ease-in-out focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 ${hoverGradientClasses} hover:text-primary h-10 gap-1.5`,
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate gap-5",
                    isActive
                      ? `${getSidebarAccentGradient()} relative font-bold hover:font-bold text-primary`
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
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

  if (!isMobile) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className={`w-64 p-0 ${getSidebarGradient()}`}>
        <SidebarContent />
      </SheetContent>
    </Sheet>
  );
}
