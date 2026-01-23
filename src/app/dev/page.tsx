import type { Metadata } from "next";
import PageClient from "@/components/landing/PageClient";
import { getHomepageAlbums, getLatestAlbumByLabelId, getAlbumById, getHomepageGriffithAlbums } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";
import { getLabelById } from "@/features/labels/data";
import { getHomepageSitePreferences } from "@/features/settings/data";
import { getHeroCarouselImages } from "@/features/hero-carousel/data";

export const revalidate = 60;

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
    url: `${baseUrl}/dev`,
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
    canonical: `${baseUrl}/dev`,
  },
};

const GRIFFITH_LABEL_ID = "689e375f-e5eb-492c-8942-cc4723c9bc91";

export default async function DevHomePage() {
  // Fetch preferences first to get featuredAlbumId
  const homepagePreferences = await getHomepageSitePreferences();
  const featuredAlbumId = homepagePreferences.featured_album_id;

  const [
    events,
    albums,
    updates,
    griffithAlbum,
    griffithLabel,
    griffithAlbums,
    heroCarouselImages,
    preferredAlbum,
  ] = await Promise.all([
    getHomepageEvents(),
    getHomepageAlbums(),
    getHomepageUpdates(),
    getLatestAlbumByLabelId(GRIFFITH_LABEL_ID),
    getLabelById(GRIFFITH_LABEL_ID),
    getHomepageGriffithAlbums(),
    getHeroCarouselImages(),
    // Include featured album query in parallel if ID exists
    featuredAlbumId ? getAlbumById(featuredAlbumId) : Promise.resolve(null),
  ]);

  // Extract preferences from batched result
  const {
    events_show_past_strikethrough: showPastStrikethrough,
    albums_homepage_columns: albumsHomepageColumnsRaw,
    updates_homepage_columns: updatesHomepageColumnsRaw,
    griffith_albums_homepage_columns: griffithAlbumsHomepageColumnsRaw,
    events_section_show: eventsSectionShow,
    albums_section_show: albumsSectionShow,
    griffith_section_show: griffithSectionShow,
    feature_section_show: featureSectionShow,
    updates_section_show: updatesSectionShow,
    events_section_order: eventsSectionOrder,
    albums_section_order: albumsSectionOrder,
    griffith_section_order: griffithSectionOrder,
    feature_section_order: featureSectionOrder,
    updates_section_order: updatesSectionOrder,
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

  const heroImage = "/hero images/01_BB_9497.jpg";
  const griffithLabelSlug = griffithLabel?.slug || "griffith-records";
  
  // Extract image URLs from carousel images
  const heroImages = heroCarouselImages.map((img) => img.image_url);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Mihai Pol",
    jobTitle: "Electronic Music Artist",
    url: `${baseUrl}/dev`,
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
        heroImage={heroImage}
        heroImages={heroImages}
        griffithLabelSlug={griffithLabelSlug}
        showPastStrikethrough={showPastStrikethrough}
        albumsHomepageColumns={albumsHomepageColumns}
        updatesHomepageColumns={updatesHomepageColumns}
        griffithAlbums={griffithAlbums}
        griffithAlbumsHomepageColumns={griffithAlbumsHomepageColumns}
        // Section visibility
        eventsSectionShow={eventsSectionShow}
        albumsSectionShow={albumsSectionShow}
        griffithSectionShow={griffithSectionShow}
        featureSectionShow={featureSectionShow}
        updatesSectionShow={updatesSectionShow}
        // Section order
        eventsSectionOrder={eventsSectionOrder}
        albumsSectionOrder={albumsSectionOrder}
        griffithSectionOrder={griffithSectionOrder}
        featureSectionOrder={featureSectionOrder}
        updatesSectionOrder={updatesSectionOrder}
      />
    </>
  );
}
