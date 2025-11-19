import { notFound } from "next/navigation";
import { MapPin, Calendar, ExternalLink } from "lucide-react";
import { getEventBySlug } from "@/features/events/data";
import { formatEventDate } from "@/components/landing/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import TrackView from "@/features/smart-links/analytics/components/TrackView";
import TrackedExternalLink from "@/components/features/TrackedExternalLink";

export const dynamic = "force-dynamic";

interface EventPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const location =
    event.city && event.venue
      ? `${event.city} – ${event.venue}`
      : event.city || event.venue || "Location TBA";

  const fullLocation = [event.city, event.country].filter(Boolean).join(", ") || null;
  const eventDate = event.date ? new Date(event.date) : null;
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <>
      <TrackView
        eventType="page_view"
        entityType="event"
        entityId={event.id}
        metadata={{ event_slug: event.slug, path: `/dev/events/${event.slug}` }}
      />
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8 max-w-5xl">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero Image */}
              {event.flyer_image_url && (
                <div className="relative rounded-3xl overflow-hidden shadow-card-hover">
                  <img
                    src={event.flyer_image_url}
                    alt={event.title}
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                </div>
              )}

              {/* Title */}
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-gradient-sunset leading-tight">
                  {event.title}
                </h1>

                {/* Location */}
                <div className="flex items-center gap-2 text-lg text-muted-foreground">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{location}</span>
                  {fullLocation && <span className="text-sm">· {fullLocation}</span>}
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <Card className="p-8 bg-card/80 backdrop-blur border-border/50">
                  <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                      {event.description.split("\n\n").map((paragraph: string, index: number) => (
                        <p key={index} className="mb-6 last:mb-0 text-muted-foreground">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Tickets Button */}
              {event.tickets_url && (
                <div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="group"
                    style={{ borderRadius: "1rem" }}
                    asChild
                  >
                    <TrackedExternalLink
                      href={event.tickets_url}
                      eventType="link_click"
                      entityType="event_link"
                      entityId={event.id}
                      metadata={{ url: event.tickets_url, event_slug: event.slug }}
                    >
                      {event.ticket_label || "Get Tickets"}
                      <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </TrackedExternalLink>
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-card/80 backdrop-blur border-border/50 sticky top-24 space-y-6">
                {/* Status Badge */}
                <div>
                  <Badge
                    variant={event.event_status === "upcoming" ? "default" : "secondary"}
                    className={
                      event.event_status === "upcoming"
                        ? "bg-primary/20 text-primary border-primary/30"
                        : ""
                    }
                  >
                    {event.event_status === "upcoming"
                      ? "Upcoming"
                      : event.event_status === "past"
                        ? "Past"
                        : "Cancelled"}
                  </Badge>
                </div>

                {/* Date */}
                {eventDate && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                    <div className="text-3xl font-bold text-primary">
                      {formatEventDate(event.date)}
                    </div>
                    {formattedDate && (
                      <div className="text-sm text-muted-foreground">{formattedDate}</div>
                    )}
                  </div>
                )}

                {/* Location Details */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Location
                  </div>
                  {event.venue && <div className="font-medium">{event.venue}</div>}
                  {event.city && <div className="text-muted-foreground">{event.city}</div>}
                  {event.country && (
                    <div className="text-sm text-muted-foreground">{event.country}</div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
