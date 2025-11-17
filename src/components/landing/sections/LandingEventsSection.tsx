import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LandingEventsList from "../lists/LandingEventsList";
import type { LandingEvent } from "../types";

type LandingEventsSectionProps = {
  events: LandingEvent[];
};

export default function LandingEventsSection({ events }: LandingEventsSectionProps) {
  return (
    <section id="events" className="py-24 px-6">
      <div className="container mx-auto px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Upcoming Events</h2>
          <p className="text-muted-foreground">Catch Mihai on tour.</p>
          <div className="w-24 h-1 bg-gradient-sunset mx-auto mt-6 rounded-full" />
        </div>
        <LandingEventsList events={events} />
        <div className="text-center mt-12">
          <Button variant="ghost" className="group" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/events">
              See full calendar
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
