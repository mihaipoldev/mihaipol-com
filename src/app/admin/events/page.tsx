import { Suspense } from "react";
import { getAllEventsUnfiltered } from "@/features/events/data";
import { EventsList } from "@/features/events/components/EventsList";
import { AdminPageLoading } from "@/components/admin/ui/AdminPageLoading";

export const dynamic = "force-dynamic";

async function EventsContent() {
  const events = await getAllEventsUnfiltered();
  return <EventsList initialEvents={events} />;
}

export default function EventsPage() {
  return (
    <Suspense fallback={<AdminPageLoading />}>
      <EventsContent />
    </Suspense>
  );
}
