import Link from "next/link";
import { formatEventDate } from "../utils";
import type { LandingEvent } from "../types";

type LandingEventItemProps = {
  event: LandingEvent;
};

export default function LandingEventItem({ event }: LandingEventItemProps) {
  const name = event.title || "Live performance";
  const venue = event.venue ?? "Venue TBA";
  const city = event.city ?? "City TBA";
  const country = event.country ?? "";
  const location = country ? `${city}, ${country}` : city;

  return (
    <div className="group border-b border-border/50 transition-all duration-200 ease-in-out hover:bg-primary/5">
      <div className="grid grid-cols-12 gap-4 py-4 px-4 items-center">
        <div className="col-span-2 text-sm font-semibold text-primary">
          {formatEventDate(event.date)}
        </div>
        <div className="col-span-3 text-sm font-medium">
          <Link
            href={`/dev/events/${event.slug}`}
            className="transition-colors duration-200 group-hover:text-primary"
          >
            {name}
          </Link>
        </div>
        <div className="col-span-3 text-sm text-muted-foreground">{venue}</div>
        <div className="col-span-3 text-sm text-muted-foreground">{location}</div>
        <div className="col-span-1 text-right">
          <a href="#" className="text-xs text-primary hover:underline transition-all duration-200">
            Tickets
          </a>
        </div>
      </div>
    </div>
  );
}
