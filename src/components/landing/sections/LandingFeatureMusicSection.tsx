import Link from "next/link";
import { Music, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LandingAlbum } from "../types";

type LandingFeatureMusicSectionProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
};

export default function LandingFeatureMusicSection({
  albums,
  fallbackImage,
}: LandingFeatureMusicSectionProps) {
  const featured = (albums ?? []).slice(0, 3); // Show up to 3 featured releases

  if (featured.length === 0) {
    return null;
  }

  return (
    <section id="feature-music" className="py-24 px-6 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-0 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Feature Music</h2>
          <p className="text-muted-foreground">Selected works and recent highlights.</p>
          <div className="w-24 h-1 bg-gradient-sunset mx-auto mt-6 rounded-full" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {featured.map((album) => (
            <Card
              key={album.id}
              className="group overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all shadow-card-hover"
            >
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={album.cover_image_url ?? fallbackImage}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="hero"
                    size="sm"
                    className="w-full"
                    style={{ borderRadius: "0.5rem" }}
                    asChild
                  >
                    <Link href={`/dev/albums/${album.slug}`}>
                      <Play className="w-4 h-4 mr-2" />
                      Listen Now
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {album.labelName && (
                    <Badge variant="outline" className="text-xs">
                      {album.labelName}
                    </Badge>
                  )}
                  <h3 className="text-xl font-semibold line-clamp-1">{album.title}</h3>
                  {album.release_date && (
                    <p className="text-sm text-muted-foreground">
                      {new Date(album.release_date).getFullYear()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center">
          <Button variant="ghost" className="group" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/albums">
              Explore all music
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

