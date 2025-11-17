"use client";

import { Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LandingAlbum, LandingEvent } from "../types";

type LandingHeroSectionProps = {
  heroImage: string;
  featuredAlbum: LandingAlbum | null;
  events: LandingEvent[];
  albums: LandingAlbum[];
};

export default function LandingHeroSection({
  heroImage,
  featuredAlbum,
  events,
  albums,
}: LandingHeroSectionProps) {
  const FALLBACK_IMAGE =
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1000&q=80";

  const heroArtwork = heroImage || FALLBACK_IMAGE;
  const heroDescription =
    "Electronic music producer crafting atmospheric soundscapes that blend melodic house with ambient textures. Based in Los Angeles, touring worldwide.";

  const handleSmoothScroll = (target: string) => {
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section className="min-h-screen flex items-center pt-20 px-6">
      <div className="container mx-auto px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-7xl font-bold text-gradient-sunset leading-tight">
                Mihai Pol
              </h1>
              <p className="text-xl text-muted-foreground">
                Music for long drives and late sunsets.
              </p>
              <p className="text-base text-muted-foreground max-w-xl">{heroDescription}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="lg" className="group" style={{ borderRadius: "1rem" }}>
                <Music className="w-4 h-4" />
                Listen to latest release
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="hover:text-accent-foreground hover:bg-accent/50"
                style={{ borderRadius: "1rem" }}
                onClick={() => handleSmoothScroll("albums")}
              >
                Explore discography
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-card-hover animate-float">
              <img src={heroArtwork} alt="Hero artwork" className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full blur-2xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
