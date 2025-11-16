"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaintbrush } from "@fortawesome/free-solid-svg-icons";
import ThemeToggle from "@/components/theme/ThemeToggle";

interface AppearanceSettingsButtonProps {
  className?: string;
}

export function AppearanceSettingsButton({
  className,
}: AppearanceSettingsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={className}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button
                  ref={buttonRef}
                  variant="ghost"
                  size="sm"
                  className="rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-accent focus-visible:bg-transparent focus-visible:ring-0 p-0"
                >
                  <div className="h-8 w-8 rounded-full flex items-center justify-center leading-9">
                    <FontAwesomeIcon
                      icon={faPaintbrush}
                      className="text-foreground/85"
                      style={{ width: "16px", height: "16px" }}
                    />
                  </div>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Appearance Settings</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Theme</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        Choose your preferred theme
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                  {/* Add more appearance settings here as needed */}
                </div>
              </SheetContent>
            </Sheet>
          </TooltipTrigger>
          <TooltipContent>
            <p>Appearance Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

