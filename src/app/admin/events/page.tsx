import { getAllEventsUnfiltered } from "@/features/events/data"
import { EventsList } from "@/features/events/components/EventsList"

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getAllEventsUnfiltered()
  
  return <EventsList initialEvents={events} />
}
