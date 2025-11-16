"use client";

import React, { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";

interface SettingsButtonProps {
  className?: string;
  onClick?: () => void;
}

export function SettingsButton({ className, onClick }: SettingsButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to admin settings page
      router.push("/admin/settings");
    }
  };

  return (
    <div className={`flex items-center ${className || ""}`}>
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              ref={buttonRef}
              variant="ghost"
              size="sm"
              onClick={handleClick}
              className="no-shadow !shadow-[0_0_0_0_transparent] hover:!shadow-[0_0_0_0_transparent] dark:!shadow-[0_0_0_0_transparent] dark:hover:!shadow-[0_0_0_0_transparent] rounded-full h-8 w-8 transition-all duration-200 max-md:hover:bg-transparent md:hover:!bg-primary/10 focus-visible:bg-transparent focus-visible:ring-0 p-0"
              style={{ boxShadow: 'none' }}
            >
              <div className="h-8 w-8 rounded-full flex items-center justify-center leading-9">
                <FontAwesomeIcon
                  icon={faGear}
                  className="text-primary"
                  style={{ width: "16px", height: "16px" }}
                />
              </div>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

