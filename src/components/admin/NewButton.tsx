"use client";

import * as React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NewButtonProps {
  className?: string;
  options?: Array<{
    label: string;
    icon?: React.ReactNode;
    href: string;
  }>;
}

export function NewButton({ className, options = [] }: NewButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Default options if none provided
  const defaultOptions =
    options.length > 0
      ? options
      : [
          { label: "Album", href: "/admin/albums/new/edit" },
          { label: "Artist", href: "/admin/artists/new/edit" },
          { label: "Event", href: "/admin/events/new/edit" },
          { label: "Label", href: "/admin/labels/new/edit" },
          { label: "Update", href: "/admin/updates/new/edit" },
          { label: "Platform", href: "/admin/platforms/new/edit" },
        ];

  return (
    <div className={`flex items-center ${className || ""}`}>
      <DropdownMenu>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={buttonRef}
                  variant="ghost"
                  size="sm"
                  className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-accent focus-visible:bg-transparent focus-visible:ring-0 p-0"
                  style={{ boxShadow: "none" }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center">
                    {/* Inner circle with primary color */}
                    <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center transition-all duration-200 hover:bg-primary/90">
                      {/* SVG Plus Icon */}
                      <svg
                        aria-hidden="true"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        className="!w-3 !h-3"
                        style={{ width: "0.75rem", height: "0.75rem" }}
                      >
                        <path d="M6.85 1a.85.85 0 1 0-1.7 0v4.15H1a.85.85 0 0 0 0 1.7h4.15V11a.85.85 0 1 0 1.7 0V6.85H11a.85.85 0 1 0 0-1.7H6.85V1Z"></path>
                      </svg>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <DropdownMenuContent align="end" className="bg-background border border-border">
          {defaultOptions.map((option, index) => (
            <DropdownMenuItem key={index} asChild>
              <Link
                href={option.href}
                className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
              >
                {option.icon && <span className="mr-2">{option.icon}</span>}
                {option.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
