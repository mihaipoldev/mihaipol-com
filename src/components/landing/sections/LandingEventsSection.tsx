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
    <section id="events" className="py-24 pb-16 px-6 relative">
      {/* Smooth transition gradient to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent to-muted/30 pointer-events-none z-0" />
      <div className="container mx-auto px-0 md:px-8 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Upcoming Events</h2>
          <p className="text-muted-foreground">Catch Mihai on tour.</p>
          <div className="w-24 h-1 bg-gradient-sunset mx-auto mt-6 rounded-full" />
        </div>
        <LandingEventsList events={events} />
        <div className="text-center mt-12">
          <Button variant="ghost" className="group hover:bg-transparent text-foreground/70 hover:text-foreground" style={{ borderRadius: "0.75rem" }} asChild>
            <Link href="/dev/events" className="relative">
              See full calendar
              <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              <span className="absolute left-0 bottom-0 w-0 h-px bg-foreground/50 group-hover:w-full transition-all duration-300 ease-out"></span>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
