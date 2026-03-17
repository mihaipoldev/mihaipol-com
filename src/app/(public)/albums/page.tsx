import { getAllAlbums } from "@/features/albums/data";
import { getSitePreferenceNumber } from "@/features/settings/data";
import type { LandingAlbum } from "@/components/landing/types";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import AlbumsPageClient from "@/components/landing/AlbumsPageClient";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type AlbumsPageProps = {
  searchParams: Promise<{ label?: string }>;
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const params = await searchParams;
  const labelSlug = params.label || undefined;

  // Map slug to label name for filtering (griffith-records -> Griffith Records)
  const labelName = labelSlug
    ? labelSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : undefined;

  const [albums, albumsPageColumnsRaw] = await Promise.all([
    getAllAlbums(labelName),
    getSitePreferenceNumber("albums_page_columns", 4),
  ]);

  // Ensure columns is between 3 and 5
  const albumsPageColumns = Math.max(3, Math.min(5, Math.round(albumsPageColumnsRaw))) as 3 | 4 | 5;

  // Separate albums by release date status
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today for accurate comparison

  const noDateAlbums: LandingAlbum[] = [];
  const upcomingAlbums: LandingAlbum[] = [];
  const pastAlbums: LandingAlbum[] = [];

  albums.forEach((album) => {
    if (!album.release_date) {
      // Albums without release dates come first
      noDateAlbums.push(album);
    } else {
      const releaseDate = new Date(album.release_date);
      releaseDate.setHours(0, 0, 0, 0);
      if (releaseDate >= today) {
        upcomingAlbums.push(album);
      } else {
        pastAlbums.push(album);
      }
    }
  });

  // Sort upcoming albums by date ascending (earliest first)
  upcomingAlbums.sort((a, b) => {
    if (!a.release_date || !b.release_date) return 0;
    return new Date(a.release_date).getTime() - new Date(b.release_date).getTime();
  });

  // Sort past albums by date descending (most recent first)
  pastAlbums.sort((a, b) => {
    if (!a.release_date || !b.release_date) return 0;
    return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
  });

  // Combine: no date first, then upcoming, then past
  const sortedAlbums = [...noDateAlbums, ...upcomingAlbums, ...pastAlbums];

  const pageTitle = labelName ?? "Discography";
  const pageDescription = labelName ? `Releases from ${labelName}.` : "All releases and collections.";

  return (
    <>
      <TrackView eventType="section_view" entityType="site_section" entityId="albums" />
      <AlbumsPageClient
        albums={sortedAlbums}
        fallbackImage={FALLBACK_IMAGE}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
        columns={albumsPageColumns as 3 | 4 | 5}
      />
    </>
  );
}
