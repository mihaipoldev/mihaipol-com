"use client";

import Link from "next/link";

import { Music, Disc3, Sparkles, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ScrollReveal from "../animations/ScrollReveal";
import type { LandingAlbum } from "../types";

type FeatureSectionProps = {
  featuredAlbum: LandingAlbum | null;
  fallbackImage: string;
  griffithLabelSlug: string;
};

export default function FeatureSection({
  featuredAlbum,
  fallbackImage,
  griffithLabelSlug,
}: FeatureSectionProps) {
  const featured = featuredAlbum ?? null;
  
  // Check if the featured release is from Griffith by checking if labelName contains "griffith"
  const isGriffithRelease = featured?.labelName?.toLowerCase().includes("griffith") ?? false;

  return (
    <section id="feature" className="py-8 md:py-16 px-6 relative overflow-hidden z-10">
      <div className="container mx-auto px-0 md:px-8 relative">
        <ScrollReveal>
          <div className="max-w-[1200px] mx-auto">
          <Card className="overflow-hidden shadow-card-hover border-2 border-primary/20 bg-card">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative aspect-square lg:aspect-auto p-6 md:p-6 lg:p-10">
                <img
                  src={featured?.cover_media?.url ?? fallbackImage}
                  alt={featured?.title ?? "Featured release"}
                  className="w-full h-full object-cover rounded-lg"
                />
                <Badge className="absolute top-4 left-4 text-white border-0 z-10 overflow-hidden">
                  {/* Base - full primary color */}
                  <div className="absolute inset-0 bg-primary" />
                  {/* Gradient overlay - secondary at 0.8 opacity */}
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--accent)) 100%)`
                    }}
                  />
                  <span className="relative z-10 inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured Release
                  </span>
                </Badge>
              </div>
              <div className="p-6 lg:p-10 flex flex-col justify-center space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Disc3 className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      {featured?.labelName ?? "Griffith Records"}
                    </span>
                  </div>
                  <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                    {featured?.title ?? "Horizon EP"}
                  </h2>
                  {featured?.description && (
                    <p className="text-muted-foreground whitespace-pre-line">
                      {featured.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button variant="hero" size="lg" style={{ borderRadius: "0.75rem" }} asChild>
                    <Link 
                      href={featured ? `/albums/${featured.slug}` : "/albums"}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Music className="w-4 h-4" />
                      Explore the Release
                    </Link>
                  </Button>
                  {isGriffithRelease && (
                    <Button
                      variant="outline"
                      size="lg"
                      className="hover:bg-transparent hover:text-foreground hover:border-border"
                      style={{ borderRadius: "0.75rem" }}
                      asChild
                    >
                      <Link href={`/albums?label=${griffithLabelSlug}`}>
                        More from Griffith
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
