import { getAllEvents } from '@/features/events/data'
import EventCard from '@/components/features/EventCard'
import TrackView from '@/features/smart-links/analytics/components/TrackView'
import PageHeader from '@/components/layout/PageHeader'

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getAllEvents()

  return (
    <div className="min-h-screen bg-background">
      <TrackView eventType="section_view" entityType="site_section" entityId="events" />
      <div className="mx-auto w-full max-w-7xl py-16">
        <PageHeader
          className="mb-12"
          title="All Events"
          description="Upcoming shows and performances."
        />

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

