import { getAllEventsUnfiltered } from "@/features/events/data"
import { EventsClient } from "./EventsClient"

export const dynamic = 'force-dynamic'

export default async function EventsPage() {
  const events = await getAllEventsUnfiltered()
  
  return <EventsClient initialEvents={events} />
}
