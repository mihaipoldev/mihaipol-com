"use client";

import { useLayoutEffect, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Client component that restores scroll position when returning from update detail pages
 * Should be placed in pages that display update lists
 */
export default function ScrollRestoration() {
  const pathname = usePathname();
  const hasRestored = useRef(false);

  // Use useLayoutEffect to restore scroll BEFORE paint to prevent Next.js from scrolling to top
  useLayoutEffect(() => {
    // Only restore scroll on the updates page
    const isUpdatesPage = pathname === "/updates";

    if (!isUpdatesPage) return;

    // Check if we have a stored scroll position from an update detail page
    const storedScrollPosition = sessionStorage.getItem("updatesPageScrollPosition");
    if (storedScrollPosition && !hasRestored.current) {
      hasRestored.current = true;
      const scrollY = parseInt(storedScrollPosition, 10);
      
      if (!isNaN(scrollY) && scrollY > 0) {
        // Set a flag to prevent other scroll logic from interfering
        sessionStorage.setItem("_restoringScroll", "true");
        
        // Restore immediately before paint to prevent Next.js scroll-to-top
        // Use multiple requestAnimationFrame calls to ensure it happens after layout
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.scrollTo({
              top: scrollY,
              behavior: "auto", // Instant scroll
            });
            
            // Clear the stored position after restoring
            setTimeout(() => {
              sessionStorage.removeItem("updatesPageScrollPosition");
              sessionStorage.removeItem("_restoringScroll");
            }, 100);
          });
        });
      } else {
        // Clear invalid position
        sessionStorage.removeItem("updatesPageScrollPosition");
      }
    }
  }, [pathname]);

  // Also handle in useEffect as fallback for cases where useLayoutEffect didn't catch it
  useEffect(() => {
    const isUpdatesPage = pathname === "/updates";

    if (!isUpdatesPage) return;

    // Check if we're already restoring (from useLayoutEffect)
    const isRestoring = sessionStorage.getItem("_restoringScroll");
    if (isRestoring) {
      // Don't run fallback if useLayoutEffect is handling it
      return;
    }

    const storedScrollPosition = sessionStorage.getItem("updatesPageScrollPosition");
    if (storedScrollPosition && !hasRestored.current) {
      hasRestored.current = true;
      const scrollY = parseInt(storedScrollPosition, 10);
      
      if (!isNaN(scrollY) && scrollY > 0) {
        sessionStorage.setItem("_restoringScroll", "true");
        
        // Use a small delay to ensure content is rendered
        const timeoutId = setTimeout(() => {
          window.scrollTo({
            top: scrollY,
            behavior: "auto",
          });
          sessionStorage.removeItem("updatesPageScrollPosition");
          setTimeout(() => {
            sessionStorage.removeItem("_restoringScroll");
          }, 100);
        }, 50);

        return () => clearTimeout(timeoutId);
      } else {
        sessionStorage.removeItem("updatesPageScrollPosition");
      }
    }
  }, [pathname]);

  // Reset the flag when pathname changes
  useEffect(() => {
    hasRestored.current = false;
  }, [pathname]);

  return null;
}
