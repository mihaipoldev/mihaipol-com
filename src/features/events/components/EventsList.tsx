"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { CoverImageCell } from "@/components/admin/CoverImageCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { StateBadge } from "@/components/admin/StateBadge"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Event = {
  id: string
  title: string
  slug: string
  venue: string | null
  city: string | null
  country: string | null
  date: string
  ticket_label: string | null
  tickets_url: string | null
  flyer_image_url: string | null
  event_status: "upcoming" | "past" | "cancelled"
  publish_status: "draft" | "scheduled" | "published" | "archived"
}

type EventsListProps = {
  initialEvents: Event[]
}

export function EventsList({ initialEvents }: EventsListProps) {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/events?id=${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete event")
      }
      
      toast.success("Event deleted successfully")
      setEvents(events.filter(e => e.id !== id))
    } catch (error: any) {
      console.error("Error deleting event:", error)
      toast.error(error.message || "Failed to delete event")
      throw error
    }
  }

  useEffect(() => {}, [])

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase()
    return (
      event.title.toLowerCase().includes(query) ||
      event.venue?.toLowerCase().includes(query) ||
      event.city?.toLowerCase().includes(query) ||
      event.country?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <div className="mb-6 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
      <AdminPageTitle 
        title="Events" 
        description="Manage your upcoming and past events, including venues, dates, and ticket information."
      />
      </div>
      <div className="space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search events..."
        >
          <Button 
            onClick={() => router.push("/admin/events/new/edit")}
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Event"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
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
              const location = [event.city, event.country].filter(Boolean).join(", ") || null
              const description = [event.venue, location].filter(Boolean).join(" / ") || undefined
              const eventStatusMetadata = event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)
              return (
              <TableRow 
                key={event.id}
                onClick={() => router.push(`/admin/events/${event.slug}/edit`)}
                className="group cursor-pointer hover:bg-muted/50"
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
                  metadata={eventStatusMetadata}
                  description={description}
                  href={`/dev/events/${event.slug}`}
                />
                <TableCell>
                  {event.date
                    ? format(new Date(event.date), "MMM d, yyyy")
                    : "-"}
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
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={event.id}
                    editHref={`/admin/events/${event.slug}/edit`}
                    openPageHref={`/dev/events/${event.slug}`}
                    onDelete={handleDelete}
                    deleteLabel={`event "${event.title}"`}
                  />
                </TableCell>
              </TableRow>
              )
            })
          )}
        </TableBody>
      </AdminTable>
      </div>
    </div>
  )
}


