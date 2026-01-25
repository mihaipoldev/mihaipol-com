"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type TabValue = "overview" | "analytics" | "links" | "content" | "automations" | "canvas";

const validTabs: TabValue[] = ["overview", "analytics", "links", "content", "automations", "canvas"];

export function useAlbumTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && validTabs.includes(urlTab as TabValue)) {
      return urlTab as TabValue;
    }
    return "overview";
  });

  // Sync tab state to URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    
    // Only update URL if it doesn't match our current state
    if (currentTab !== activeTab) {
      const params = new URLSearchParams(searchParams.toString());
      if (activeTab) {
        params.set("tab", activeTab);
      } else {
        params.delete("tab");
      }
      const newUrl = params.toString() 
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [activeTab, searchParams, router, pathname]);

  const handleTabChange = (value: string) => {
    if (validTabs.includes(value as TabValue)) {
      setActiveTab(value as TabValue);
    }
  };

  return {
    activeTab,
    setActiveTab: handleTabChange,
  };
}
