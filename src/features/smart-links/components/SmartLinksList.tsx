"use client";

import SmartLinkItem, { SmartLink } from "./SmartLinkItem";
import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";

type SmartLinksListProps = {
  links: SmartLink[];
  disableTracking?: boolean;
};

export default function SmartLinksList({ links, disableTracking }: SmartLinksListProps) {
  const { cardBgColor, mutedColor, colors } = useAlbumColors();

  // Calculate subtle hover color for the row
  const getHoverColor = () => {
    // Use a subtle overlay - balanced visibility
    return "rgba(0, 0, 0, 0.07)";
  };

  // Calculate divider color using album colors
  const getDividerColor = () => {
    // Use the first album color with subtle opacity for the divider
    if (colors.length > 0) {
      const albumColor = colors[0];
      const match = albumColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        // Use a subtle opacity (0.15) to create an elegant divider
        return `rgba(${r}, ${g}, ${b}, 0.15)`;
      }
    }

    // Fallback to a subtle gray if no album colors available
    return "rgba(0, 0, 0, 0.1)";
  };

  if (links.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-sm" style={{ color: mutedColor }}>
          No links available yet.
        </p>
      </div>
    );
  }

  return (
    <div>
      {links.map((link, index) => (
        <div key={link.id}>
          {index > 0 && <div style={{ backgroundColor: getDividerColor(), height: "1px" }} />}
          <SmartLinkItem
            link={link}
            className="flex items-center justify-between px-6 py-4 transition-all duration-200"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = getHoverColor();
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            debug={{ link }}
            disableTracking={disableTracking}
          />
        </div>
      ))}
    </div>
  );
}
