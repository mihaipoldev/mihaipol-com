"use client";

import React from "react";
import TrackedLink from "./TrackedLink";

export type SmartLink = {
  id: string;
  url: string;
  platformName: string;
  platformIconUrl?: string | null;
  ctaLabel?: string | null;
};

type SmartLinkItemProps = {
  link: SmartLink;
  className?: string;
  debug?: Record<string, unknown>;
  disableTracking?: boolean;
};

export default function SmartLinkItem({ link, className, debug, disableTracking }: SmartLinkItemProps) {
  return (
    <TrackedLink
      key={link.id}
      href={link.url}
      externalUrl={link.url}
      entityId={link.id}
      label={link.platformName}
      rightLabel={link.ctaLabel || "Play"}
      className={className}
      debug={{ link, ...(debug || {}) }}
      disableTracking={disableTracking}
    />
  );
}


