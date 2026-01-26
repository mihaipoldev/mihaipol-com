"use client";

import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentScope, setCurrentScope] = useState<TimeScope>("30");

  // Get current scope from localStorage
  useEffect(() => {
    setMounted(true);
    setCurrentScope(getStoredScope());
  }, []);

  // Listen for localStorage changes (from other tabs/windows)
  useEffect(() => {
    if (!mounted) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newScope = e.newValue as TimeScope;
        if (["7", "30", "90", "365", "all"].includes(newScope)) {
          setCurrentScope(newScope);
        }
      }
    };

    // Poll for same-tab changes (storage event doesn't fire in same tab)
    const interval = setInterval(() => {
      const stored = getStoredScope();
      if (stored !== currentScope) {
        setCurrentScope(stored);
      }
    }, 100);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [mounted, currentScope]);

  // Get current scope label
  const currentScopeLabel = timeScopeOptions.find((opt) => opt.value === currentScope)?.label || "30 days";

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    
    checkDarkMode();
    
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => observer.disconnect();
  }, []);

  const handleScopeChange = (value: TimeScope) => {
    // Save to localStorage and cookie
    setStoredScope(value);
    // Update local state immediately
    setCurrentScope(value);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-auto p-0 font-semibold text-foreground hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-0 hover:bg-transparent cursor-pointer flex items-center gap-1.5 transition-colors"
        >
          {currentScopeLabel}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        sideOffset={0}
        className="px-0 py-2 border-0 w-32 bg-popover"
        style={{
          boxShadow: isDarkMode ? 'none' : 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px;'
        }}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {timeScopeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleScopeChange(option.value)}
            className={cn(
              "cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground",
              currentScope === option.value && "bg-accent/50"
            )}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
