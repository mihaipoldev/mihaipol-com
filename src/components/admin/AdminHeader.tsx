"use client"

import { AdminSidebarMobile } from "./AdminSidebar"
import { AdminBreadcrumb } from "./AdminBreadcrumb"
import { NotificationButton } from "./NotificationButton"
import { SettingsButton } from "./SettingsButton"
import { NewButton } from "./NewButton"
import { ShowMoreMenu } from "./ShowMoreMenu"

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2 bg-background">
      <AdminSidebarMobile />
      <div className="flex flex-1 items-center gap-4 h-full">
        <AdminBreadcrumb />
        <div className="flex flex-1 items-center justify-end gap-2 h-full">
          <NotificationButton />
          <SettingsButton />
          <NewButton />
          <ShowMoreMenu />
        </div>
      </div>
    </header>
  )
}

