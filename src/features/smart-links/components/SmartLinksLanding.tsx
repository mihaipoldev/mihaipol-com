"use client";

import LinksLogger from "@/components/dev/LinksLogger";
import React from "react";
import CoverArt from "./CoverArt";
import AlbumHeader from "./AlbumHeader";
import SmartLinksList from "./SmartLinksList";
import { SmartLink } from "./SmartLinkItem";
import { useAlbumColors } from "@/components/landing/AlbumGradientBackground";

type AlbumSummary = {
  id: string;
  title: string;
  slug: string;
  artistName?: string | null;
  catalog_number?: string | null;
  coverImageUrl?: string | null;
};

type SmartLinksLandingProps = {
  album: AlbumSummary;
  links: SmartLink[];
  showDebug?: boolean;
  disableTracking?: boolean;
};

export default function SmartLinksLanding({
  album,
  links,
  showDebug,
  disableTracking,
}: SmartLinksLandingProps) {
  const { cardBgColor } = useAlbumColors();

  return (
    <>
      {showDebug ? <LinksLogger value={links} label="Album links" /> : null}

      <div className="w-full px-4 py-8 sm:py-12">
        <div className="w-full max-w-md mx-auto space-y-6 sm:space-y-8">
          <div className="relative mx-auto w-full max-w-[360px] flex-shrink-0">
            <CoverArt title={album.title} coverImageUrl={album.coverImageUrl} />
          </div>

          <div className="flex-shrink-0">
            <AlbumHeader
              title={album.title}
              artistName={album.artistName}
              catalog_number={album.catalog_number}
            />
          </div>

          <div
            className="flex-shrink-0 overflow-hidden rounded-3xl shadow-xl backdrop-blur-xl border border-white/10 dark:border-white/5 transition-all duration-1000"
            style={{ backgroundColor: cardBgColor }}
          >
            <SmartLinksList links={links} disableTracking={disableTracking} />
          </div>
        </div>
      </div>
    </>
  );
}
