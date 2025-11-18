import { notFound } from "next/navigation";
import { getAlbumSmartLinksBySlug } from "@/features/smart-links";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import LinksLogger from "@/components/dev/LinksLogger";
import { SmartLinksLanding } from "@/features/smart-links";
import AlbumGradientBackground from "@/components/landing/AlbumGradientBackground";
import AlbumFooterWithColors from "./AlbumFooterWithColors";

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
      <div className="flex-1 relative z-10 min-h-0 flex flex-col">
        <div className="flex flex-col items-center px-4 flex-1">
          <div className="w-full max-w-sm mx-auto py-6">
            <div className="flex flex-col">
              <SmartLinksLanding album={album} links={links} />
            </div>
          </div>
        </div>
        <AlbumFooterWithColors />
      </div>
    </AlbumGradientBackground>
  );
}
