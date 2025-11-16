"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
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
} from "@fortawesome/free-solid-svg-icons"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useState } from "react"

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
]

const smartLinksItems = [
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: faChartLine,
  },
  {
    title: "Releases",
    href: "/admin/releases",
    icon: faCompactDisc,
  },
  {
    title: "Platforms",
    href: "/admin/platforms",
    icon: faRadio,
  },
]

const settingsItems = [
  {
    title: "Settings",
    href: "/admin/settings",
    icon: faGear,
  },
]

function SidebarContent() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center justify-between px-6 mt-1">
        <Link href="/admin" className="flex flex-col">
          <span className="text-2xl font-bold text-sidebar-foreground leading-tight uppercase">Mihai Pol</span>
          <span className="text-xs text-sidebar-foreground/60 leading-tight -mt-0.5">Admin</span>
        </Link>
        <Link href="/dev">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-sidebar-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors !shadow-none dark:!shadow-none hover:!shadow-none dark:hover:!shadow-none ring-0 focus-visible:ring-0"
            aria-label="Go to website"
          >
            <FontAwesomeIcon icon={faExternalLink} className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 p-4 pt-5">
        {/* Overview Category */}
        <div className="space-y-2">
          <div className="text-sm md:text-xs font-normal text-sidebar-foreground/70 px-3">
            Overview
          </div>
          <div className="flex flex-col gap-00">
            {overviewItems.map((item) => {
              // For Dashboard, only match exactly /admin, not sub-routes
              // For other items, match the exact route or sub-routes
              const isActive = item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    "peer/menu-button flex w-full items-center overflow-hidden rounded-md px-4 py-2 text-left text-[15px] font-normal outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:font-medium h-10 gap-5",
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate",
                    isActive
                      ? "bg-sidebar-accent font-bold hover:font-bold text-sidebar-accent-foreground"
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Smart Links Category */}
        <div className="space-y-2">
          <div className="text-sm md:text-xs font-normal text-sidebar-foreground/70 px-3">
            Smart Links
          </div>
          <div className="flex flex-col gap-0">
            {smartLinksItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    "peer/menu-button flex w-full items-center overflow-hidden rounded-md px-4 py-2 text-left text-[15px] font-normal outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:font-medium h-10 gap-1.5",
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate gap-5",
                    isActive
                      ? "bg-sidebar-accent font-bold hover:font-bold text-sidebar-accent-foreground"
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Settings Category */}
        <div className="space-y-2">
          <div className="text-sm md:text-xs font-normal text-sidebar-foreground/70 px-3">
            Settings
          </div>
          <div className="flex flex-col gap-0">
            {settingsItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => router.push(item.href)}
                  data-active={isActive}
                  className={cn(
                    "peer/menu-button flex w-full items-center overflow-hidden rounded-md px-4 py-2 text-left text-[15px] font-normal outline-none ring-sidebar-ring transition-[width,height,padding] focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:font-medium h-12 gap-1.5",
                    "[&>svg]:size-4 [&>svg]:shrink-0",
                    "[&>span:last-child]:truncate gap-5",
                    isActive
                      ? "bg-sidebar-accent font-bold hover:font-bold text-sidebar-accent-foreground"
                      : "text-sidebar-muted-foreground"
                  )}
                >
                  <FontAwesomeIcon icon={item.icon} />
                  <span>{item.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="text-xs text-sidebar-muted-foreground">
          <p className="font-medium">Mihai Pol</p>
          <p>Admin Dashboard</p>
        </div>
      </div>
    </div>
  )
}

export function AdminSidebar() {
  return <SidebarContent />
}

export function AdminSidebarMobile() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)

  if (!isMobile) return null

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Open menu"
        >
          <FontAwesomeIcon icon={faBars} className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent />
      </SheetContent>
    </Sheet>
  )
}

