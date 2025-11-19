import type { Metadata } from "next";
import LandingPageClient from "@/components/landing/LandingPageClient";
import { getHomepageAlbums, getLatestAlbumByLabelId } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";
import { getLabelById } from "@/features/labels/data";
import { getSitePreferenceBoolean, getSitePreferenceNumber } from "@/features/settings/data";

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
  ] = await Promise.all([
    getHomepageEvents(),
    getHomepageAlbums(),
    getHomepageUpdates(),
    getLatestAlbumByLabelId(GRIFFITH_LABEL_ID),
    getLabelById(GRIFFITH_LABEL_ID),
    getSitePreferenceBoolean("events_show_past_strikethrough", true),
    getSitePreferenceNumber("albums_homepage_columns", 3),
    getSitePreferenceNumber("updates_homepage_columns", 3),
  ]);

  // Ensure columns are between 3 and 5
  const albumsHomepageColumns = Math.max(3, Math.min(5, Math.round(albumsHomepageColumnsRaw))) as
    | 3
    | 4
    | 5;
  const updatesHomepageColumns = Math.max(3, Math.min(5, Math.round(updatesHomepageColumnsRaw))) as
    | 3
    | 4
    | 5;

  const heroImage = "/hero images/01_BB_9497.jpg";
  const griffithLabelSlug = griffithLabel?.slug || "griffith-records";

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
        featuredAlbum={griffithAlbum}
        heroImage={heroImage}
        griffithLabelSlug={griffithLabelSlug}
        showPastStrikethrough={showPastStrikethrough}
        albumsHomepageColumns={albumsHomepageColumns}
        updatesHomepageColumns={updatesHomepageColumns}
      />
    </>
  );
}
