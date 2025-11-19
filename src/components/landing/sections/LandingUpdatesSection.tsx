"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingUpdatesList from "../lists/LandingUpdatesList";
import type { LandingUpdate } from "../types";
import type { UpdateCardVariant } from "../items/LandingUpdateItem";

type LandingUpdatesSectionProps = {
  updates: LandingUpdate[];
  fallbackImage: string;
  variant?: UpdateCardVariant;
  columns?: 3 | 4 | 5;
};

export default function LandingUpdatesSection({
  updates,
  fallbackImage,
  variant = "card-badge",
  columns = 3,
}: LandingUpdatesSectionProps) {
  return (
    <section id="updates" className="py-10 md:py-20 px-6">
      <div className="container mx-auto px-0 md:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Updates</h2>
          <p className="text-muted-foreground">Recent activity and upcoming moves.</p>
        </div>
        <LandingUpdatesList
          updates={updates}
          fallbackImage={fallbackImage}
          variant={variant}
          columns={columns}
        />
        <div className="text-center mt-12">
          <Button
            variant="ghost"
            className="group hover:bg-transparent text-foreground/70 hover:text-foreground"
            style={{ borderRadius: "0.75rem" }}
            asChild
          >
            <Link
              href="/dev/updates"
              className="relative"
              onClick={() => {
                // Store the current section before navigating
                if (typeof window !== "undefined") {
                  sessionStorage.setItem("landingPageScrollSection", "updates");
                }
              }}
            >
              View all updates
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
