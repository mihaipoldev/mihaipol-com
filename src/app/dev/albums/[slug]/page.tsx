import { notFound } from "next/navigation";
import { getAlbumSmartLinksBySlug } from "@/features/smart-links";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import LinksLogger from "@/components/dev/LinksLogger";
import { SmartLinksLanding } from "@/features/smart-links";
import AlbumGradientBackground from "@/components/landing/AlbumGradientBackground";
import AlbumFooter from "@/components/landing/AlbumFooter";
import React from "react";

export const dynamic = "force-dynamic";

interface AlbumDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AlbumDetailPage({ params }: AlbumDetailPageProps) {
  const { slug } = await params;
  const data = await getAlbumSmartLinksBySlug(slug);

  if (!data) {
    notFound();
  }

  const { album, links } = data;
  return (
    <AlbumGradientBackground coverImageUrl={album.coverImageUrl}>
      <TrackView
        eventType="page_view"
        entityType="album"
        entityId={album.id}
        metadata={{ album_slug: album.slug, path: `/dev/albums/${album.slug}` }}
      />
      <LinksLogger value={links} label="Album links" />
      <div className="flex-1 relative z-10 overflow-y-auto min-h-0">
        <div className="min-h-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <SmartLinksLanding album={album} links={links} />
          </div>
          <AlbumFooter />
        </div>
      </div>
    </AlbumGradientBackground>
  );
}
