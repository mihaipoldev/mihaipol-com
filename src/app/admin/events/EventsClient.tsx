"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { StateBadge } from "@/components/admin/StateBadge"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
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

type EventsClientProps = {
  initialEvents: Event[]
}

export function EventsClient({ initialEvents }: EventsClientProps) {
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
      <AdminPageTitle title="Events" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search events..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/events/new/edit")}>
            New Event
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Tickets</TableHead>
            <TableHead>Publish Status</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {searchQuery ? "No events found matching your search" : "No events found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredEvents.map((event) => {
              const location = [event.city, event.country].filter(Boolean).join(", ") || null
              const description = [event.venue, location].filter(Boolean).join(" / ") || undefined
              const eventStatusMetadata = event.event_status.charAt(0).toUpperCase() + event.event_status.slice(1)
              return (
              <TableRow key={event.id}>
                <TableTitleCell 
                  title={event.title}
                  imageUrl={event.flyer_image_url}
                  showInitials={true}
                  metadata={eventStatusMetadata}
                  description={description}
                  href={`/dev/events/${event.slug}`}
                  className="pl-4"
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

