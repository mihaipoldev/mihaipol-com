import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingUpdatesList from "../lists/LandingUpdatesList";
import type { LandingUpdate } from "../types";

type LandingUpdatesSectionProps = {
  updates: LandingUpdate[];
  fallbackImage: string;
};

export default function LandingUpdatesSection({
  updates,
  fallbackImage,
}: LandingUpdatesSectionProps) {
  return (
    <section id="updates" className="py-24 px-6">
      <div className="container mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Updates</h2>
          <p className="text-muted-foreground">Latest news and announcements.</p>
        </div>
        <LandingUpdatesList updates={updates} fallbackImage={fallbackImage} />
        <div className="text-center mt-12">
          <Button variant="ghost" className="group" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/updates">
              View all updates
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
