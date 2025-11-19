import { getAllAlbums } from "@/features/albums/data";
import { getLabelBySlug } from "@/features/labels/data";
import LandingAlbumsList from "@/components/landing/lists/LandingAlbumsList";
import type { LandingAlbum } from "@/components/landing/types";
import TrackView from "@/features/smart-links/analytics/components/TrackView";

export const dynamic = "force-dynamic";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type AlbumsPageProps = {
  searchParams: Promise<{ label?: string }>;
};

export default async function AlbumsPage({ searchParams }: AlbumsPageProps) {
  const params = await searchParams;
  const labelSlug = params.label || undefined;
  
  // Fetch label info if filtering by label
  const label = labelSlug ? await getLabelBySlug(labelSlug) : null;
  const albums = await getAllAlbums(undefined, labelSlug);

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

  const pageTitle = label ? label.name : "Discography";
  const pageDescription = label 
    ? `Releases from ${label.name}.`
    : "All releases and collections.";

  return (
    <div className="min-h-dvh">
      <TrackView
        eventType="section_view"
        entityType="site_section"
        entityId="albums"
      />
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>

          {sortedAlbums.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No albums yet. Check back soon.</p>
            </div>
          ) : (
            <LandingAlbumsList albums={sortedAlbums} fallbackImage={FALLBACK_IMAGE} columns={4} />
          )}
        </div>
      </div>
    </div>
  );
}
