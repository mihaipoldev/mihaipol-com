"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SettingsSidebar } from "@/components/admin/settings/SettingsSidebar";
import { SettingsContent } from "@/components/admin/settings/SettingsContent";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPalette, faGear } from "@fortawesome/free-solid-svg-icons";

type SettingsSection = "account" | "appearance" | "preferences";

// Map internal sections to URL-friendly names
const SECTION_URL_MAP: Record<SettingsSection, string> = {
  account: "account",
  appearance: "appearance",
  preferences: "preferences",
};

const URL_SECTION_MAP: Record<string, SettingsSection> = {
  account: "account",
  appearance: "appearance",
  preferences: "preferences",
};

const VALID_SECTIONS: SettingsSection[] = ["account", "appearance", "preferences"];

function SettingsPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<SettingsSection>(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && URL_SECTION_MAP[urlTab]) {
      return URL_SECTION_MAP[urlTab];
    }

    if (typeof window !== "undefined") {
      const savedSection = localStorage.getItem(
        "admin-settings-last-section"
      ) as SettingsSection | null;
      if (savedSection && VALID_SECTIONS.includes(savedSection)) {
        return savedSection;
      }
    }

    return "account";
  });

  // Update URL when section changes
  useEffect(() => {
    const urlTab = SECTION_URL_MAP[activeSection];
    const currentTab = searchParams.get("tab");

    if (currentTab !== urlTab) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", urlTab);
      router.replace(`/admin/settings?${params.toString()}`, { scroll: false });
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("admin-settings-last-section", activeSection);
    }
  }, [activeSection, searchParams, router]);

  const handleSectionChange = (section: SettingsSection) => {
    setActiveSection(section);
  };

  return (
    <div className="w-full">
      {isMobile ? (
        // Mobile layout with tabs
        <div className="flex flex-col gap-2 -mt-4 md:mt-0">
          <Tabs
            value={activeSection}
            onValueChange={(value) => handleSectionChange(value as SettingsSection)}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faPalette} className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <FontAwesomeIcon icon={faGear} className="h-4 w-4" />
                <span className="hidden sm:inline">Prefs</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      ) : (
        // Desktop layout with sidebar
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPageInner />
    </Suspense>
  );
}
