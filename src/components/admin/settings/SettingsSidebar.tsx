"use client";

import { ChevronRight } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPalette, faGear } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

type SettingsSection = "account" | "appearance" | "preferences";

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const sections: Array<{
  id: SettingsSection;
  label: string;
  icon: typeof faUser;
  description: string;
}> = [
  {
    id: "account",
    label: "Account",
    icon: faUser,
    description: "Manage your profile and account",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: faPalette,
    description: "Theme & colors",
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: faGear,
    description: "App preferences",
  },
];

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const isActive = activeSection === section.id;

        return (
          <button
            key={section.id}
            onClick={() => onSectionChange(section.id)}
            className={cn(
              "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 text-left group border",
              isActive
                ? "bg-primary/10 border-primary shadow-sm"
                : "border-transparent text-sidebar-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <FontAwesomeIcon
              icon={section.icon}
              className={cn("h-5 w-5 flex-shrink-0 ml-2 mr-2", isActive ? "text-primary" : "")}
            />
            <div className="flex-1 min-w-0">
              <div className={cn("text-base font-bold", isActive ? "text-primary" : "")}>
                {section.label}
              </div>
              <div className="text-[12px] text-muted-foreground -mt-0.5 truncate">
                {section.description}
              </div>
            </div>
            <ChevronRight
              className={cn(
                "h-4 w-4 flex-shrink-0 transition-opacity",
                isActive ? "text-primary opacity-100" : "opacity-0"
              )}
            />
          </button>
        );
      })}
    </nav>
  );
}
