import LinksLogger from "@/components/dev/LinksLogger";
import React from "react";
import CoverArt from "./CoverArt";
import AlbumHeader from "./AlbumHeader";
import SmartLinksList from "./SmartLinksList";
import { SmartLink } from "./SmartLinkItem";

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

export default function SmartLinksLanding({ album, links, showDebug, disableTracking }: SmartLinksLandingProps) {
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gradient-to-br from-blue-50 via-blue-100/50 to-slate-100 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-800">
      {showDebug ? <LinksLogger value={links} label="Album links" /> : null}

      <div className="min-h-screen">
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:py-16">
          <div className="w-full max-w-md space-y-8">
            <div className="relative mx-auto w-full max-w-[360px]">
              <CoverArt title={album.title} coverImageUrl={album.coverImageUrl} />
            </div>

            <AlbumHeader title={album.title} artistName={album.artistName} catalog_number={album.catalog_number} />

            <div className="overflow-hidden rounded-3xl bg-white shadow-xl dark:bg-gray-800">
              <SmartLinksList links={links} disableTracking={disableTracking} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


