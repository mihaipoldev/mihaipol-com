import { getAllEvents } from "@/features/events/data";
import EventsList from "@/components/landing/lists/EventsList";
import TrackView from "@/features/smart-links/analytics/components/TrackView";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getAllEvents();

  return (
    <>
      <TrackView eventType="section_view" entityType="site_section" entityId="events" />
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
            <p className="text-muted-foreground">Catch Mihai on tour.</p>
            <div className="relative w-24 h-1 mx-auto mt-6">
              {/* Base - full primary color */}
              <div className="absolute inset-0 w-24 h-1 rounded-full bg-primary" />
              {/* Gradient overlay - secondary at 0.8 opacity */}
              <div 
                className="absolute inset-0 w-24 h-1 rounded-full"
                style={{
                  background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--accent)) 100%)`
                }}
              />
            </div>
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No events yet. Check back soon.</p>
            </div>
          ) : (
            <EventsList events={events} showPastStrikethrough={true} />
          )}
        </div>
      </div>
    </>
  );
}
