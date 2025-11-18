"use client";

import LandingHeroSection from "./sections/LandingHeroSection";
import LandingFeatureMusicSection from "./sections/LandingFeatureMusicSection";
import LandingAlbumsSection from "./sections/LandingAlbumsSection";
import LandingEventsSection from "./sections/LandingEventsSection";
import LandingGriffithSection from "./sections/LandingGriffithSection";
import LandingUpdatesSection from "./sections/LandingUpdatesSection";
import type { LandingAlbum, LandingEvent, LandingUpdate } from "./types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

type LandingPageClientProps = {
  events: LandingEvent[];
  albums: LandingAlbum[];
  updates: LandingUpdate[];
  featuredAlbum: LandingAlbum | null;
  heroImage: string;
  griffithLabelSlug: string;
};

export default function LandingPageClient({
  events,
  albums,
  updates,
  featuredAlbum,
  heroImage,
  griffithLabelSlug,
}: LandingPageClientProps) {
  const featured = featuredAlbum ?? albums[0] ?? null;

  return (
    <>
      <LandingHeroSection
        heroImage={heroImage}
        featuredAlbum={featured}
        events={events}
        albums={albums}
      />

      <LandingEventsSection events={events} />

      <LandingAlbumsSection albums={albums} fallbackImage={FALLBACK_IMAGE} />

      <LandingGriffithSection featuredAlbum={featuredAlbum} fallbackImage={FALLBACK_IMAGE} griffithLabelSlug={griffithLabelSlug} />

      <LandingUpdatesSection updates={updates} fallbackImage={FALLBACK_IMAGE} variant="compact" />
    </>
  );
}
