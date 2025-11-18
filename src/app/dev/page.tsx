import LandingPageClient from "@/components/landing/LandingPageClient";
import { getHomepageAlbums, getLatestAlbumByLabelId } from "@/features/albums/data";
import { getHomepageEvents } from "@/features/events/data";
import { getHomepageUpdates } from "@/features/updates/data";
import { getLabelById } from "@/features/labels/data";

export const dynamic = "force-dynamic";

const GRIFFITH_LABEL_ID = "689e375f-e5eb-492c-8942-cc4723c9bc91";

export default async function DevHomePage() {
  const [events, albums, updates, griffithAlbum, griffithLabel] = await Promise.all([
    getHomepageEvents(4),
    getHomepageAlbums(3),
    getHomepageUpdates(3),
    getLatestAlbumByLabelId(GRIFFITH_LABEL_ID),
    getLabelById(GRIFFITH_LABEL_ID),
  ]);

  const heroImage = "/hero images/01_BB_9497.jpg";
  const griffithLabelSlug = griffithLabel?.slug || "griffith-records";

  return (
    <LandingPageClient
      events={events}
      albums={albums}
      updates={updates}
      featuredAlbum={griffithAlbum}
      heroImage={heroImage}
      griffithLabelSlug={griffithLabelSlug}
    />
  );
}
