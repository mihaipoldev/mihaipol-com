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
    <section id="albums" className="pt-0 md:pt-16 px-6 bg-muted/30">
      <div className="container mx-auto px-0 md:px-8 pb-12 md:pb-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Discography</h2>
          <p className="text-muted-foreground">Sound works. Carefully considered.</p>
        </div>
        <LandingAlbumsList albums={albums} fallbackImage={fallbackImage} />
        <div className="text-center mt-12">
          <Button variant="ghost" className="group hover:bg-transparent text-foreground/70 hover:text-foreground" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/albums" className="relative">
              View all releases
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
