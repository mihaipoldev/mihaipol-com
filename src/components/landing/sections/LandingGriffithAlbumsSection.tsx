"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingAlbumsList from "../lists/LandingAlbumsList";
import type { LandingAlbum } from "../types";

type LandingGriffithAlbumsSectionProps = {
  albums: LandingAlbum[];
  fallbackImage: string;
  columns?: 3 | 4 | 5;
  griffithLabelSlug: string;
};

export default function LandingGriffithAlbumsSection({
  albums,
  fallbackImage,
  columns = 3,
  griffithLabelSlug,
}: LandingGriffithAlbumsSectionProps) {
  return (
    <section id="griffith-albums" className="pt-0 md:pt-16 px-6">
      <div className="container mx-auto px-0 md:px-8 pb-10 md:pb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Griffith Records</h2>
          <p className="text-muted-foreground">Releases from Griffith Records.</p>
        </div>
        <LandingAlbumsList albums={albums} fallbackImage={fallbackImage} columns={columns} />
        <div className="text-center mt-12">
          <Button
            variant="ghost"
            className="group hover:bg-transparent text-foreground/70 hover:text-foreground"
            style={{ borderRadius: "0.75rem" }}
            asChild
          >
            <Link
              href={`/dev/albums?label=${griffithLabelSlug}`}
              className="relative"
              onClick={() => {
                // Store the current section before navigating
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("landingPageScrollSection", "griffith-albums");
                }
              }}
            >
              View all Griffith releases
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

