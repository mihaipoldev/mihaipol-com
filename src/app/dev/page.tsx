import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { getHomepageAlbums, getLatestAlbumByLabelId, getAlbumById, getHomepageGriffithAlbums } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";
import { getLabelById } from "@/features/labels/data";
import { getSitePreferenceBoolean, getSitePreferenceNumber, getSitePreferenceString } from "@/features/settings/data";
import { getHeroCarouselImages } from "@/features/hero-carousel/data";

export const dynamic = "force-dynamic";

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
  const [
    events,
    albums,
    updates,
    griffithAlbum,
    griffithLabel,
    showPastStrikethrough,
    albumsHomepageColumnsRaw,
    updatesHomepageColumnsRaw,
    featuredAlbumId,
    griffithAlbums,
    griffithAlbumsHomepageColumnsRaw,
    heroCarouselImages,
    // Section visibility preferences
    eventsSectionShow,
    albumsSectionShow,
    griffithSectionShow,
    featureSectionShow,
    updatesSectionShow,
    // Section order preferences
    eventsSectionOrder,
    albumsSectionOrder,
    griffithSectionOrder,
    featureSectionOrder,
    updatesSectionOrder,
  ] = await Promise.all([
    getHomepageEvents(),
    getHomepageAlbums(),
    getHomepageUpdates(),
    getLatestAlbumByLabelId(GRIFFITH_LABEL_ID),
    getLabelById(GRIFFITH_LABEL_ID),
    getSitePreferenceBoolean("events_show_past_strikethrough", true),
    getSitePreferenceNumber("albums_homepage_columns", 3),
    getSitePreferenceNumber("updates_homepage_columns", 3),
    getSitePreferenceString("featured_album_id", null),
    getHomepageGriffithAlbums(),
    getSitePreferenceNumber("griffith_albums_homepage_columns", 3),
    getHeroCarouselImages(),
    // Section visibility
    getSitePreferenceBoolean("events_section_show", true),
    getSitePreferenceBoolean("albums_section_show", true),
    getSitePreferenceBoolean("griffith_section_show", true),
    getSitePreferenceBoolean("feature_section_show", true),
    getSitePreferenceBoolean("updates_section_show", true),
    // Section order
    getSitePreferenceNumber("events_section_order", 1),
    getSitePreferenceNumber("albums_section_order", 2),
    getSitePreferenceNumber("griffith_section_order", 3),
    getSitePreferenceNumber("feature_section_order", 4),
    getSitePreferenceNumber("updates_section_order", 5),
  ]);

  // Get featured album: use preference if set, otherwise fallback to griffith album
  let featuredAlbum = griffithAlbum;
  if (featuredAlbumId) {
    const preferredAlbum = await getAlbumById(featuredAlbumId);
    if (preferredAlbum && preferredAlbum.publish_status === "published") {
      featuredAlbum = preferredAlbum;
    }
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
      <LandingPageClient
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
