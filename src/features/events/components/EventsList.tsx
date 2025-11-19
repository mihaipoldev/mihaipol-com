"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  AdminTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/admin/AdminTable";
import { TableTitleCell } from "@/components/admin/TableTitleCell";
import { CoverImageCell } from "@/components/admin/CoverImageCell";
import { ActionMenu } from "@/components/admin/ActionMenu";
import { StateBadge } from "@/components/admin/StateBadge";
import { AdminPageTitle } from "@/components/admin/AdminPageTitle";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

type Event = {
  id: string;
  title: string;
  slug: string;
  venue: string | null;
  city: string | null;
  country: string | null;
  date: string;
  ticket_label: string | null;
  tickets_url: string | null;
  flyer_image_url: string | null;
  event_status: "upcoming" | "past" | "cancelled";
  publish_status: "draft" | "scheduled" | "published" | "archived";
};

type EventsListProps = {
  initialEvents: Event[];
};

export function EventsList({ initialEvents }: EventsListProps) {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async (id: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      const response = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete event");
      }

      toast.success("Event deleted successfully");
      setEvents(events.filter((e) => e.id !== id));
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast.error(error.message || "Failed to delete event");
      throw error;
    }
  };

  useEffect(() => {}, []);

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query) ||
      event.city?.toLowerCase().includes(query) ||
      event.country?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <AdminPageTitle
          title="Events"
          description="Manage your upcoming and past events, including venues, dates, and ticket information."
        />
      </div>
      <div className="space-y-3 md:space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search events..."
        >
          <Button
            asChild
            variant="ghost"
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Event"
          >
            <Link href="/admin/events/new/edit">
              <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
            </Link>
          </Button>
        </AdminToolbar>

        <AdminTable>
          <TableHeader className="hidden md:table-header-group">
            <TableRow>
              <TableHead className="pl-4 w-24">Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Tickets</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  {searchQuery ? "No events found matching your search" : "No events found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const location = [event.city, event.country].filter(Boolean).join(", ") || null;
                const description =
                  [event.venue, location].filter(Boolean).join(" / ") || undefined;
                // Build location string in "Name @ Location" format
                const locationParts = [];
                if (event.venue) locationParts.push(event.venue);
                if (location) locationParts.push(location);
                const nameAtLocation =
                  locationParts.length > 0
                    ? `${event.title} @ ${locationParts.join(" / ")}`
                    : event.title;
                return (
                  <>
                    {/* Mobile Layout */}
                    <TableRow
                      key={`${event.id}-mobile`}
                      className="md:hidden group cursor-pointer hover:bg-muted/50 border-b border-border/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/events/${event.slug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/events/${event.slug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest("[data-action-menu]") ||
                            (e.target as HTMLElement).closest("a[href]")
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <TableCell className="px-3 md:pl-4 md:pr-4 py-4" colSpan={6}>
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="h-12 w-12 rounded-full overflow-hidden flex items-center justify-center bg-muted shadow-md flex-shrink-0">
                              {event.flyer_image_url ? (
                                <img
                                  src={event.flyer_image_url}
                                  alt={event.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-xs font-semibold text-muted-foreground">
                                  {event.title
                                    .split(/\s+/)
                                    .map((w) => w[0])
                                    .join("")
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-base mb-1.5 break-words">
                                {nameAtLocation}
                              </div>
                              <div className="text-sm text-muted-foreground space-y-0.5">
                                {event.date && (
                                  <div>{format(new Date(event.date), "MMM d, yyyy")}</div>
                                )}
                                {event.tickets_url && event.ticket_label && (
                                  <div>
                                    <a
                                      href={event.tickets_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {event.ticket_label}
                                    </a>
                                  </div>
                                )}
                              </div>
                              <div className="mt-2">
                                <StateBadge state={event.publish_status} />
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-2" data-action-menu>
                              <ActionMenu
                                itemId={event.id}
                                editHref={`/admin/events/${event.slug}/edit`}
                                openPageHref={`/dev/events/${event.slug}`}
                                statsHref={`/admin/events/${event.slug}/stats`}
                                onDelete={handleDelete}
                                deleteLabel={`event "${event.title}"`}
                              />
                            </div>
                          </div>
                        </TableCell>
                      </Link>
                    </TableRow>

                    {/* Desktop Layout */}
                    <TableRow
                      key={`${event.id}-desktop`}
                      className="hidden md:table-row group cursor-pointer hover:bg-muted/50"
                      onMouseDown={(e) => {
                        if (e.button === 1) {
                          e.preventDefault();
                          window.open(`/admin/events/${event.slug}/edit`, "_blank");
                        }
                      }}
                    >
                      <Link
                        href={`/admin/events/${event.slug}/edit`}
                        className="contents"
                        onClick={(e) => {
                          if (
                            (e.target as HTMLElement).closest("[data-action-menu]") ||
                            (e.target as HTMLElement).closest("a[href]")
                          ) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <CoverImageCell
                          imageUrl={event.flyer_image_url}
                          title={event.title}
                          showInitials={true}
                          className="pl-4"
                        />
                        <TableTitleCell
                          title={event.title}
                          imageUrl={undefined}
                          showInitials={false}
                          description={description}
                          href={`/dev/events/${event.slug}`}
                        />
                        <TableCell>
                          {event.date ? format(new Date(event.date), "MMM d, yyyy") : "-"}
                        </TableCell>
                        <TableCell>
                          {event.tickets_url && event.ticket_label ? (
                            <a
                              href={event.tickets_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {event.ticket_label}
                            </a>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <StateBadge state={event.publish_status} />
                        </TableCell>
                        <TableCell className="text-right pr-4" data-action-menu>
                          <ActionMenu
                            itemId={event.id}
                            editHref={`/admin/events/${event.slug}/edit`}
                            openPageHref={`/dev/events/${event.slug}`}
                            statsHref={`/admin/events/${event.slug}/stats`}
                            onDelete={handleDelete}
                            deleteLabel={`event "${event.title}"`}
                          />
                        </TableCell>
                      </Link>
                    </TableRow>
                  </>
                );
              })
            )}
          </TableBody>
        </AdminTable>
      </div>
    </div>
  );
}
