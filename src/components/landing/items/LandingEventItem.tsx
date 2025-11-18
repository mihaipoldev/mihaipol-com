import Link from "next/link";
import { formatEventDate } from "../utils";
import type { LandingEvent } from "../types";
import TrackedExternalLink from "@/components/features/TrackedExternalLink";

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
    <div className="group border-b border-border/50 transition-all duration-200 ease-in-out hover:translate-x-1">
      {/* Mobile Layout */}
      <div className="md:hidden py-4 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary mb-1.5">
              {formatEventDate(event.date)}
            </div>
            <Link
              href={`/dev/events/${event.slug}`}
              className="block text-sm font-medium mb-1.5 transition-colors duration-200 group-hover:text-primary"
            >
              {name}
            </Link>
            <div className="text-sm text-muted-foreground">{location}</div>
          </div>
          <div className="flex-shrink-0 text-right">
            {event.tickets_url ? (
              <TrackedExternalLink
                href={event.tickets_url}
                eventType="link_click"
                entityType="event_link"
                entityId={event.id}
                metadata={{ url: event.tickets_url, event_slug: event.slug }}
                className="text-xs text-primary hover:underline transition-all duration-200"
              >
                {event.ticket_label || "Tickets"}
              </TrackedExternalLink>
            ) : (
              <span className="text-xs text-muted-foreground">TBA</span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-12 gap-4 py-4 px-4 items-center">
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
          {event.tickets_url ? (
            <TrackedExternalLink
              href={event.tickets_url}
              eventType="link_click"
              entityType="event_link"
              entityId={event.id}
              metadata={{ url: event.tickets_url, event_slug: event.slug }}
              className="text-xs text-primary hover:underline transition-all duration-200"
            >
              {event.ticket_label || "Tickets"}
            </TrackedExternalLink>
          ) : (
            <span className="text-xs text-muted-foreground">TBA</span>
          )}
        </div>
      </div>
    </div>
  );
}
