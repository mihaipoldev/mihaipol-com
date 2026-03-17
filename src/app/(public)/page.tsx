import type { Metadata } from "next";
import PageClient from "@/components/landing/PageClient";
import { getHomepageAlbums, getLatestAlbumByLabelName, getPublishedAlbumById, getHomepageGriffithAlbums } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";
import { getHomepageSitePreferences } from "@/features/settings/data";
import { getHeroCarouselImages } from "@/features/hero-carousel/data";

// Force dynamic rendering since this route uses cookies via Supabase client
export const dynamic = 'force-dynamic';

const baseUrl = "https://mihaipol.com";

export const metadata: Metadata = {
  title: "Mihai Pol",
  description:
    "Electronic music artist. Discover latest albums, upcoming live events, and music updates.",
  openGraph: {
    title: "Mihai Pol",
    description:
      "Electronic music artist. Discover latest albums, upcoming live events, and music updates.",
    type: "website",
    url: baseUrl,
    siteName: "Mihai Pol",
    images: [
      {
        url: `${baseUrl}/hero images/01_BB_9497.jpg`,
        width: 1200,
        height: 630,
        alt: "Mihai Pol - Electronic music artist",
      },
    ],
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default async function HomePage() {
  // Fetch preferences first to get featuredAlbumId
  const homepagePreferences = await getHomepageSitePreferences();
  const featuredAlbumId = homepagePreferences.featured_album_id;

  const [
    events,
    albums,
    updates,
    griffithAlbum,
    griffithAlbums,
    preferredAlbum,
  ] = await Promise.all([
    getHomepageEvents(),
    getHomepageAlbums(),
    getHomepageUpdates(),
    getLatestAlbumByLabelName("Griffith Records"),
    getHomepageGriffithAlbums(),
    // Include featured album query in parallel if ID exists
    featuredAlbumId ? getPublishedAlbumById(featuredAlbumId) : Promise.resolve(null),
  ]);

  const {
    events_show_past_strikethrough: showPastStrikethrough,
    albums_homepage_columns: albumsHomepageColumnsRaw,
    updates_homepage_columns: updatesHomepageColumnsRaw,
    griffith_albums_homepage_columns: griffithAlbumsHomepageColumnsRaw,
  } = homepagePreferences;

  // Get featured album: use preference if set and valid, otherwise fallback to griffith album
  let featuredAlbum = griffithAlbum;
  if (preferredAlbum && preferredAlbum.publish_status === "published") {
    featuredAlbum = preferredAlbum;
  }

  // Ensure columns are between 3 and 5
  const albumsHomepageColumns = Math.max(3, Math.min(5, Math.round(albumsHomepageColumnsRaw))) as
    | 3
    | 4
    | 5;
  const updatesHomepageColumns = Math.max(3, Math.min(5, Math.round(updatesHomepageColumnsRaw))) as
    | 3
    | 4
    | 5;
  const griffithAlbumsHomepageColumns = Math.max(3, Math.min(5, Math.round(griffithAlbumsHomepageColumnsRaw))) as
    | 3
    | 4
    | 5;

  const heroImages = getHeroCarouselImages();
  const griffithLabelSlug = "griffith-records";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mihai Pol",
    jobTitle: "Electronic Music Artist",
    url: baseUrl,
    image: `${baseUrl}/hero images/01_BB_9497.jpg`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <PageClient
        events={events}
        albums={albums}
        updates={updates}
        featuredAlbum={featuredAlbum}
        heroImage={heroImages[0]}
        heroImages={heroImages}
        griffithLabelSlug={griffithLabelSlug}
        showPastStrikethrough={showPastStrikethrough}
        albumsHomepageColumns={albumsHomepageColumns}
        updatesHomepageColumns={updatesHomepageColumns}
        griffithAlbums={griffithAlbums}
        griffithAlbumsHomepageColumns={griffithAlbumsHomepageColumns}
      />
    </>
  );
}
