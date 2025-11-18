import { getAllEvents } from "@/features/events/data";
import LandingEventsList from "@/components/landing/lists/LandingEventsList";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getAllEvents();

  return (
    <div className="min-h-dvh">
      <div className="py-24 px-6">
        <div className="container mx-auto px-0 md:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Upcoming Events</h1>
            <p className="text-muted-foreground">Catch Mihai on tour.</p>
            <div className="w-24 h-1 bg-gradient-sunset mx-auto mt-6 rounded-full" />
          </div>

          {events.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No events yet. Check back soon.</p>
            </div>
          ) : (
            <LandingEventsList events={events} />
          )}
        </div>
      </div>
    </div>
  );
}
