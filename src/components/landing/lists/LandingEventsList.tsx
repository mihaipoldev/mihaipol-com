import LandingEventItem from "../items/LandingEventItem";
import type { LandingEvent } from "../types";

type LandingEventsListProps = {
  events: LandingEvent[];
};

export default function LandingEventsList({ events }: LandingEventsListProps) {
  return (
    <div className="space-y-0">
      {events.map((event) => (
        <LandingEventItem key={event.id} event={event} />
      ))}
    </div>
  );
}
