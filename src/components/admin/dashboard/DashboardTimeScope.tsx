"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TimeScope = "7" | "30" | "90" | "365" | "all";

const STORAGE_KEY = "admin-analytics-scope";
const COOKIE_NAME = "admin-analytics-scope";

const timeScopeOptions: { value: TimeScope; label: string }[] = [
  { value: "7", label: "7 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
  { value: "365", label: "1 year" },
  { value: "all", label: "All" },
];

function getStoredScope(): TimeScope {
  if (typeof window === "undefined") return "30";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && ["7", "30", "90", "365", "all"].includes(stored)) {
    return stored as TimeScope;
  }
  return "30";
}

function setStoredScope(scope: TimeScope) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, scope);

  // Also set cookie for server-side access
  document.cookie = `${COOKIE_NAME}=${scope}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
}

export function DashboardTimeScope() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // Get scope from URL param, or localStorage, or default to "30"
  const urlScope = searchParams.get("scope") as TimeScope | null;
  const storedScope = getStoredScope();
  const currentScope = urlScope || (mounted ? storedScope : "30");

  // On mount, sync URL with localStorage if needed
  useEffect(() => {
    setMounted(true);
    if (!urlScope && storedScope !== "30") {
      // If no URL param but we have a stored scope (not default), update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("scope", storedScope);
      router.replace(`${pathname}?${params.toString()}`);
    } else if (urlScope && urlScope !== storedScope) {
      // If URL param differs from stored, update localStorage and cookie
      setStoredScope(urlScope);
    }
  }, [pathname, router, searchParams, storedScope, urlScope]);

  const handleScopeChange = (value: TimeScope) => {
    // Save to localStorage and cookie
    setStoredScope(value);

    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (value === "30") {
      // Default value, remove from URL
      params.delete("scope");
    } else {
      params.set("scope", value);
    }
    const queryString = params.toString();
    router.push(`${pathname}${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <Select value={currentScope} onValueChange={handleScopeChange}>
      <SelectTrigger className="w-[140px] h-9">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {timeScopeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
