import Link from "next/link";
import { formatEventDate } from "../utils";
import type { LandingEvent } from "../types";
import TrackedExternalLink from "@/components/features/TrackedExternalLink";
import { cn } from "@/lib/utils";

type LandingEventItemProps = {
  event: LandingEvent;
  showPastStrikethrough: boolean;
};

// Helper function to convert country name to country code
function getCountryCode(country: string): string {
  const countryCodeMap: Record<string, string> = {
    Romania: "RO",
    "United States": "US",
    "United Kingdom": "UK",
    Germany: "DE",
    France: "FR",
    Italy: "IT",
    Spain: "ES",
    Netherlands: "NL",
    Belgium: "BE",
    Switzerland: "CH",
    Austria: "AT",
    Poland: "PL",
    "Czech Republic": "CZ",
    Hungary: "HU",
    Greece: "GR",
    Portugal: "PT",
    Sweden: "SE",
    Norway: "NO",
    Denmark: "DK",
    Finland: "FI",
  };

  return countryCodeMap[country] || country.substring(0, 2).toUpperCase();
}

export default function LandingEventItem({ event, showPastStrikethrough }: LandingEventItemProps) {
  const name = event.title || "Live performance";
  const venue = event.venue;
  const city = event.city;
  const country = event.country;

  // Check if event is past yesterday (only if strikethrough is enabled)
  const isPastYesterday =
    showPastStrikethrough &&
    (() => {
      if (!event.date) return false;
      const eventDate = new Date(event.date);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999); // End of yesterday
      return eventDate < yesterday;
    })();

  // Build location parts array
  const buildLocationParts = (useCountryCode: boolean = false) => {
    const parts: string[] = [];

    if (venue) {
      parts.push(venue);
    }

    if (city) {
      parts.push(city);
    }

    if (country) {
      parts.push(useCountryCode ? getCountryCode(country) : country);
    }

    return parts;
  };

  const locationPartsDesktop = buildLocationParts(false);
  const locationPartsMobile = buildLocationParts(true);

  // Separator component for larger dots
  const Separator = () => <span className="mx-1.5 text-base">·</span>;

  return (
    <div
      className={cn(
        "group border-b border-border/50 transition-all duration-200 ease-in-out hover:translate-x-1",
        isPastYesterday && "opacity-60"
      )}
    >
      {/* Mobile Layout */}
      <div className="md:hidden py-4 px-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                "text-sm font-semibold text-primary mb-1.5",
                isPastYesterday && "line-through"
              )}
            >
              {formatEventDate(event.date)}
            </div>
            <Link
              href={`/dev/events/${event.slug}`}
              className={cn(
                "block text-sm font-medium mb-1.5 transition-colors duration-200 group-hover:text-primary",
                isPastYesterday && "line-through"
              )}
            >
              {name}
            </Link>
            <div
              className={cn(
                "text-sm text-muted-foreground flex items-center",
                isPastYesterday && "line-through"
              )}
            >
              {locationPartsMobile.map((part, index) => (
                <span key={index}>
                  {part}
                  {index < locationPartsMobile.length - 1 && <Separator />}
                </span>
              ))}
            </div>
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
        <div
          className={cn(
            "col-span-3 text-sm font-semibold text-primary",
            isPastYesterday && "line-through"
          )}
        >
          {formatEventDate(event.date)}
        </div>
        <div className={cn("col-span-4 text-sm font-medium", isPastYesterday && "line-through")}>
          <Link
            href={`/dev/events/${event.slug}`}
            className="transition-colors duration-200 group-hover:text-primary"
          >
            {name}
          </Link>
        </div>
        <div
          className={cn(
            "col-span-4 text-sm text-muted-foreground flex items-center",
            isPastYesterday && "line-through"
          )}
        >
          {locationPartsDesktop.map((part, index) => (
            <span key={index}>
              {part}
              {index < locationPartsDesktop.length - 1 && <Separator />}
            </span>
          ))}
        </div>
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
