import Link from "next/link";

import { Music, Disc3, Sparkles, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LandingAlbum } from "../types";

type LandingGriffithSectionProps = {
  featuredAlbum: LandingAlbum | null;
  fallbackImage: string;
  griffithLabelSlug: string;
};

export default function LandingGriffithSection({
  featuredAlbum,
  fallbackImage,
  griffithLabelSlug,
}: LandingGriffithSectionProps) {
  const featured = featuredAlbum ?? null;

  return (
    <section id="griffith" className="py-12 md:py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-background to-primary/10" />
      <div className="container mx-auto px-0 md:px-8 relative">
        <div className="max-w-6xl mx-auto">
          <Card className="overflow-hidden shadow-card-hover border-2 border-primary/20 bg-card/80 backdrop-blur">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="relative aspect-square lg:aspect-auto">
                <img
                  src={featured?.cover_image_url ?? fallbackImage}
                  alt={featured?.title ?? "Featured release"}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-gradient-sunset text-white border-0">
                  <Sparkles className="w-3 h-3" />
                  Featured Release
                </Badge>
              </div>
              <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
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
                    <p className="text-muted-foreground whitespace-pre-line">{featured.description}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button variant="hero" size="lg" style={{ borderRadius: "0.75rem" }} asChild>
                    <Link href={featured ? `/dev/albums/${featured.slug}` : "/dev/albums"}>
                      <Music className="w-4 h-4" />
                      Explore the Release
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="hover:bg-transparent hover:text-foreground hover:border-border"
                    style={{ borderRadius: "0.75rem" }}
                    asChild
                  >
                    <Link href={`/dev/albums?label=${griffithLabelSlug}`}>
                      More from Griffith
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
