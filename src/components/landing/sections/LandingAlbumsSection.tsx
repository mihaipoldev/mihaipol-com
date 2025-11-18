import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingAlbumsList from "../lists/LandingAlbumsList";
import type { LandingAlbum } from "../types";

type LandingAlbumsSectionProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
};

export default function LandingAlbumsSection({ albums, fallbackImage }: LandingAlbumsSectionProps) {
  return (
    <section id="albums" className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto px-0 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Albums &amp; Singles</h2>
          <p className="text-muted-foreground">Selected releases and fan favorites.</p>
        </div>
        <LandingAlbumsList albums={albums} fallbackImage={fallbackImage} />
        <div className="text-center mt-12">
          <Button variant="ghost" className="group" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/albums">
              View all releases
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
