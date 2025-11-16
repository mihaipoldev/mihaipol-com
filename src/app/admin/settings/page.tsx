"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SettingsSidebar } from "@/components/admin/settings/SettingsSidebar"
import { SettingsContent } from "@/components/admin/settings/SettingsContent"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"

type SettingsSection = "account" | "appearance" | "preferences"

// Map internal sections to URL-friendly names
const SECTION_URL_MAP: Record<SettingsSection, string> = {
  account: "account",
  appearance: "appearance",
  preferences: "preferences",
}

const URL_SECTION_MAP: Record<string, SettingsSection> = {
  account: "account",
  appearance: "appearance",
  preferences: "preferences",
}

const VALID_SECTIONS: SettingsSection[] = ["account", "appearance", "preferences"]

function SettingsPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    const urlTab = searchParams.get("tab")
    if (urlTab && URL_SECTION_MAP[urlTab]) {
      return URL_SECTION_MAP[urlTab]
    }

    if (typeof window !== "undefined") {
      const savedSection = localStorage.getItem(
        "admin-settings-last-section"
      ) as SettingsSection | null
      if (savedSection && VALID_SECTIONS.includes(savedSection)) {
        return savedSection
      }
    }

    return "account"
  })

  // Update URL when section changes
  useEffect(() => {
    const urlTab = SECTION_URL_MAP[activeSection]
    const currentTab = searchParams.get("tab")

    if (currentTab !== urlTab) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", urlTab)
      router.replace(`/admin/settings?${params.toString()}`, { scroll: false })
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("admin-settings-last-section", activeSection)
    }
  }, [activeSection, searchParams, router])

  return (
    <div className="w-full">
      <div className="mb-6">
        <AdminPageTitle title="Settings" />
        <p className="text-muted-foreground mt-1">
          Manage your account, app preferences, and appearance
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <SettingsContent activeSection={activeSection} />
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  )
}

