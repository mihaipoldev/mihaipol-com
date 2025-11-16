"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell } from "@fortawesome/free-solid-svg-icons";

interface NotificationButtonProps {
  className?: string;
  onClick?: () => void;
  hasUnread?: boolean;
}

export function NotificationButton({
  className,
  onClick,
  hasUnread = false,
}: NotificationButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={`flex items-center ${className || ""}`}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="ghost"
              size="sm"
              onClick={onClick}
              className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-accent focus-visible:bg-transparent focus-visible:ring-0 p-0 relative"
              style={{ boxShadow: 'none' }}
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center leading-9">
                <FontAwesomeIcon
                  icon={faBell}
                  className="text-foreground/85"
                  style={{ width: "16px", height: "16px" }}
                />
              </div>
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Notifications</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

