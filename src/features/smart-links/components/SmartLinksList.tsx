"use client";

import SmartLinkItem, { SmartLink } from "./SmartLinkItem";
import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";

type SmartLinksListProps = {
  links: SmartLink[];
  disableTracking?: boolean;
};

export default function SmartLinksList({ links, disableTracking }: SmartLinksListProps) {
  const { cardBgColor, mutedColor } = useAlbumColors();

  // Calculate hover color (slightly darker/lighter than card bg)
  const getHoverColor = () => {
    // Extract RGB from cardBgColor
    const match = cardBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "rgba(0, 0, 0, 0.05)";

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const opacity = match[4] ? parseFloat(match[4]) : 1;

    // Make it slightly darker for hover
    const hoverR = Math.max(0, r - 10);
    const hoverG = Math.max(0, g - 10);
    const hoverB = Math.max(0, b - 10);

    return `rgba(${hoverR}, ${hoverG}, ${hoverB}, ${opacity})`;
  };

  // Calculate divider color (subtle version of card bg)
  const getDividerColor = () => {
    const match = cardBgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (!match) return "rgba(0, 0, 0, 0.1)";

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    const opacity = match[4] ? parseFloat(match[4]) * 0.3 : 0.3;

    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
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
            className="flex items-center justify-between px-6 py-4 transition-colors"
            style={
              {
                "--hover-bg": getHoverColor(),
              } as React.CSSProperties & { "--hover-bg": string }
            }
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
