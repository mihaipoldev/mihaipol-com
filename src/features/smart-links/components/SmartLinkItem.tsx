"use client";

import React from "react";
import TrackedLink from "./TrackedLink";

export type SmartLink = {
  id: string;
  url: string;
  platformName: string;
  platformIconUrl?: string | null;
  platformIconHorizontalUrl?: string | null;
  ctaLabel?: string | null;
};

type SmartLinkItemProps = {
  link: SmartLink;
  className?: string;
  style?: React.CSSProperties;
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  debug?: Record<string, unknown>;
  disableTracking?: boolean;
};

export default function SmartLinkItem({
  link,
  className,
  style,
  onMouseEnter,
  onMouseLeave,
  debug,
  disableTracking,
}: SmartLinkItemProps) {
  return (
    <TrackedLink
      key={link.id}
      href={link.url}
      externalUrl={link.url}
      entityId={link.id}
      horizontalIconUrl={link.platformIconHorizontalUrl}
      rightLabel={link.ctaLabel || "Play"}
      className={className}
      style={style}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      debug={{ link, ...(debug || {}) }}
      disableTracking={disableTracking}
    />
  );
}
