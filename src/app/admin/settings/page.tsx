"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SettingsSidebar } from "@/features/settings/components/SettingsSidebar";
import { SettingsContent } from "@/features/settings/components/SettingsContent";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPalette, faHome, faPlug } from "@fortawesome/free-solid-svg-icons";

type SettingsSection = "account" | "appearance" | "landing-page" | "integrations";

// Map internal sections to URL-friendly names
const SECTION_URL_MAP: Record<SettingsSection, string> = {
  account: "account",
  appearance: "appearance",
  "landing-page": "landing-page",
  integrations: "integrations",
};

const URL_SECTION_MAP: Record<string, SettingsSection> = {
  account: "account",
  appearance: "appearance",
  "landing-page": "landing-page",
  integrations: "integrations",
};

const VALID_SECTIONS: SettingsSection[] = ["account", "appearance", "landing-page", "integrations"];

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
        <div className="flex flex-col" style={{ marginTop: '-24px' }}>
          <div className="sticky top-[72px] z-10 bg-background/95 backdrop-blur-sm border-b border-border/50 -mx-4 md:-mx-10 lg:-mx-12 px-4 md:px-10 lg:px-12 pt-2 pb-2">
            <Tabs
              value={activeSection}
              onValueChange={(value) => handleSectionChange(value as SettingsSection)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4 bg-transparent p-1">
                <TabsTrigger 
                  value="account" 
                  className="flex items-center gap-2 data-[state=active]:bg-card/50 data-[state=active]:dark:bg-card/30 data-[state=active]:backdrop-blur-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/[2%] data-[state=active]:via-primary/[1%] data-[state=active]:to-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
                  <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="appearance" 
                  className="flex items-center gap-2 data-[state=active]:bg-card/50 data-[state=active]:dark:bg-card/30 data-[state=active]:backdrop-blur-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/[2%] data-[state=active]:via-primary/[1%] data-[state=active]:to-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FontAwesomeIcon icon={faPalette} className="h-4 w-4" />
                  <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="integrations" 
                  className="flex items-center gap-2 data-[state=active]:bg-card/50 data-[state=active]:dark:bg-card/30 data-[state=active]:backdrop-blur-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/[2%] data-[state=active]:via-primary/[1%] data-[state=active]:to-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FontAwesomeIcon icon={faPlug} className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="landing-page" 
                  className="flex items-center gap-2 data-[state=active]:bg-card/50 data-[state=active]:dark:bg-card/30 data-[state=active]:backdrop-blur-sm data-[state=active]:bg-gradient-to-br data-[state=active]:from-primary/[2%] data-[state=active]:via-primary/[1%] data-[state=active]:to-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  <FontAwesomeIcon icon={faHome} className="h-4 w-4" />
                  <span className="hidden sm:inline">Landing</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {/* Main Content */}
          <div className="flex-1 min-w-0 mt-2">
            <SettingsContent activeSection={activeSection} />
          </div>
        </div>
      ) : (
        // Desktop layout with sidebar
        <div className="flex gap-6">
          {/* Sidebar - sticky */}
          <div className="w-64 flex-shrink-0">
            <div className="sticky top-[88px]">
              <SettingsSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
            </div>
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
