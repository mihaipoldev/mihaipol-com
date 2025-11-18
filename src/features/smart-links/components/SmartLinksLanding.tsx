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
  const { cardBgColor, colorsReady } = useAlbumColors();

  return (
    <>
      {showDebug ? <LinksLogger value={links} label="Album links" /> : null}

      <div className="w-full px-4 py-4 sm:py-6">
        <div className="w-full max-w-sm mx-auto space-y-5 sm:space-y-6">
          <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[260px] flex-shrink-0">
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
            className="flex-shrink-0 overflow-hidden rounded-3xl shadow-xl backdrop-blur-xl transition-opacity duration-300"
            style={{ 
              backgroundColor: cardBgColor,
              opacity: colorsReady ? 1 : 0,
            }}
          >
            <SmartLinksList links={links} disableTracking={disableTracking} />
          </div>
        </div>
      </div>
    </>
  );
}
