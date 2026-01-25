"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faDesktop,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ThemeSwitcherButton() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-8 w-8 rounded-full flex items-center justify-center">
        <div className="h-4 w-4" />
      </div>
    );
  }

  const getThemeIcon = () => {
    if (theme === "dark") return faMoon;
    if (theme === "light") return faSun;
    return faDesktop; // system
  };

  return (
    <div className="flex items-center">
      <TooltipProvider delayDuration={200}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-accent focus-visible:bg-transparent focus-visible:ring-0 p-0"
                  style={{ boxShadow: "none" }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center leading-9">
                    <FontAwesomeIcon
                      icon={getThemeIcon()}
                      className="text-foreground/85"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Theme</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent 
            align="end"
            sideOffset={0}
            className="px-0 py-2 border-0 w-48"
            style={{
              boxShadow: 'rgba(0, 0, 0, 0.2) 0px 2px 4px -1px, rgba(0, 0, 0, 0.14) 0px 4px 5px 0px, rgba(0, 0, 0, 0.12) 0px 1px 10px 0px'
            }}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className={cn(
                "cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground",
                theme === "light" 
                  ? "data-[highlighted]:!bg-accent" 
                  : "data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              )}
            >
              <FontAwesomeIcon icon={faSun} className="mr-2 h-4 w-4" />
              <span className="flex-1">Light</span>
              {theme === "light" && (
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className={cn(
                "cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground",
                theme === "dark" 
                  ? "data-[highlighted]:!bg-accent" 
                  : "data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              )}
            >
              <FontAwesomeIcon icon={faMoon} className="mr-2 h-4 w-4" />
              <span className="flex-1">Dark</span>
              {theme === "dark" && (
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className={cn(
                "cursor-pointer !rounded-none px-4 py-2 focus:!bg-accent focus:!text-accent-foreground",
                theme === "system" 
                  ? "data-[highlighted]:!bg-accent" 
                  : "data-[highlighted]:!bg-accent data-[highlighted]:!text-accent-foreground"
              )}
            >
              <FontAwesomeIcon icon={faDesktop} className="mr-2 h-4 w-4" />
              <span className="flex-1">System</span>
              {theme === "system" && (
                <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}
