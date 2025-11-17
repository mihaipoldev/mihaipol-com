import LandingPageClient from "@/components/landing/LandingPageClient";
import { getHomepageAlbums } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";

export const dynamic = "force-dynamic";

const HERO_FALLBACK = "/_93A4805.JPG";

export default async function DevHomePage() {
  const [events, albums, updates] = await Promise.all([
    getHomepageEvents(4),
    getHomepageAlbums(3),
    getHomepageUpdates(3),
  ]);

  const featuredAlbum =
    albums.find((album) => (album.labelName ?? "").toLowerCase() === "griffith records") ??
    albums[0] ??
    null;

  const heroImage = "/_93A4805.JPG";

  return (
    <LandingPageClient
      events={events}
      albums={albums}
      updates={updates}
      featuredAlbum={featuredAlbum}
      heroImage={heroImage}
    />
  );
}
