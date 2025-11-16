import { getAllEvents } from '@/features/events/data'
import EventCard from '@/components/features/EventCard'
import TrackView from '@/components/analytics/TrackView'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getAllEvents()

  return (
    <div className="min-h-screen bg-background">
      <TrackView eventType="section_view" entityType="site_section" entityId="events" />
      <div className="mx-auto w-full max-w-7xl py-16">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">All Events</h1>
          <p className="text-lg text-muted-foreground">
            Upcoming shows and performances.
          </p>
        </div>

        {/* Events List */}
        {events.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No events yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-0">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                slug={event.slug}
                title={event.title}
                city={event.city}
                venue={event.venue}
                date={event.date}
                className="w-full"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

