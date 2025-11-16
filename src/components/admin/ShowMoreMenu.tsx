"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

export interface SubMenuOption {
  id: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  selected?: boolean;
}

export interface MenuOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
  separator?: boolean;
  submenu?: SubMenuOption[];
}

interface ShowMoreMenuProps {
  pageSpecificOptions?: MenuOption[];
  defaultOptions?: MenuOption[];
  className?: string;
}

export function ShowMoreMenu({
  pageSpecificOptions = [],
  defaultOptions = [],
  className,
}: ShowMoreMenuProps) {
  const allOptions = [...pageSpecificOptions, ...defaultOptions];

  // Add separators between page-specific and default options if both exist
  const optionsWithSeparators = [];
  if (pageSpecificOptions.length > 0 && defaultOptions.length > 0) {
    optionsWithSeparators.push(
      ...pageSpecificOptions,
      {
        id: "separator",
        label: "",
        onClick: () => {},
        separator: true,
      },
      ...defaultOptions
    );
  } else {
    optionsWithSeparators.push(...allOptions);
  }

  return (
    <div className={`flex items-center ${className || ""}`}>
      <TooltipProvider delayDuration={200}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-accent focus-visible:bg-transparent focus-visible:ring-0 p-0"
                  style={{ boxShadow: 'none' }}
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center leading-9">
                    <FontAwesomeIcon
                      icon={faEllipsis}
                      className="text-foreground/85"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </div>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>More Options</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            {optionsWithSeparators.map((option, index) => {
              if (option.separator) {
                return <DropdownMenuSeparator key={`separator-${index}`} />;
              }

              // If the option has a submenu, render a DropdownMenuSub
              if (option.submenu && option.submenu.length > 0) {
                return (
                  <DropdownMenuSub key={option.id}>
                    <DropdownMenuSubTrigger
                      disabled={option.disabled}
                      className={cn(
                        "cursor-pointer hover:bg-accent hover:text-accent-foreground [&[data-state='open']]:bg-accent [&[data-state='open']]:text-accent-foreground",
                        option.variant === "destructive" &&
                          "text-destructive focus:text-destructive"
                      )}
                    >
                      {option.icon && <span className="mr-2">{option.icon}</span>}
                      {option.label}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {option.submenu.map((subOption) => (
                        <DropdownMenuItem
                          key={subOption.id}
                          onClick={subOption.onClick}
                          disabled={subOption.disabled}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <span>{subOption.label}</span>
                          {subOption.selected && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="currentColor"
                              className="ml-2"
                            >
                              <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
                            </svg>
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                );
              }

              return (
                <DropdownMenuItem
                  key={option.id}
                  onClick={option.onClick}
                  disabled={option.disabled}
                  className={cn(
                    "cursor-pointer",
                    option.variant === "destructive" &&
                      "text-destructive focus:text-destructive"
                  )}
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </TooltipProvider>
    </div>
  );
}

