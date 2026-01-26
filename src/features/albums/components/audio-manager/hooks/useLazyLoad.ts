"use client";

import { useState, useEffect } from "react";
import type { UseLazyLoadOptions, UseLazyLoadReturn } from "../types";

export function useLazyLoad(options: UseLazyLoadOptions): UseLazyLoadReturn {
  const { elementRef, enabled = true, rootMargin = "200px" } = options;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled || !elementRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [elementRef, enabled, rootMargin]);

  return { isVisible };
}
