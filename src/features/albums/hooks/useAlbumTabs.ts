"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type TabValue = "overview" | "analytics" | "links" | "content" | "automations" | "canvas";

const validTabs: TabValue[] = ["overview", "analytics", "links", "content", "automations", "canvas"];

export function useAlbumTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  // Track whether we're in the middle of a user-initiated change
  const isUserChangeRef = useRef(false);
  const userChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [activeTab, setActiveTabState] = useState<TabValue>(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && validTabs.includes(urlTab as TabValue)) {
      return urlTab as TabValue;
    }
    return "overview";
  });

  // Extract URL tab value for effect dependency
  const urlTabParam = searchParams.get("tab");
  const urlTabValue = (urlTabParam && validTabs.includes(urlTabParam as TabValue)) 
    ? (urlTabParam as TabValue) 
    : "overview";

  // User-initiated tab change
  const handleTabChange = useCallback((value: string) => {
    if (validTabs.includes(value as TabValue)) {
      const newTab = value as TabValue;
      
      // Mark that we're in a user change
      isUserChangeRef.current = true;
      
      // Clear any pending timeout
      if (userChangeTimeoutRef.current) {
        clearTimeout(userChangeTimeoutRef.current);
      }
      
      // Update state immediately (drives the UI)
      setActiveTabState(newTab);
      
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      if (newTab && newTab !== "overview") {
        params.set("tab", newTab);
      } else {
        params.delete("tab");
      }
      const newUrl = params.toString() 
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
      
      // Clear the user change flag after a delay
      userChangeTimeoutRef.current = setTimeout(() => {
        isUserChangeRef.current = false;
      }, 500);
    }
  }, [pathname, searchParams, router]);

  // Sync state from URL (for browser back/forward navigation)
  // Use the actual URL tab value as dependency, not searchParams
  useEffect(() => {
    // Skip if we're in the middle of a user change
    if (isUserChangeRef.current) {
      return;
    }

    // Only update if URL differs from current state
    if (urlTabValue !== activeTab) {
      setActiveTabState(urlTabValue);
    }
  }, [urlTabValue, activeTab]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (userChangeTimeoutRef.current) {
        clearTimeout(userChangeTimeoutRef.current);
      }
    };
  }, []);

  return {
    activeTab,
    setActiveTab: handleTabChange,
  };
}
