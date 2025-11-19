import LandingEventItem from "../items/LandingEventItem";
import type { LandingEvent } from "../types";

type LandingEventsListProps = {
  events: LandingEvent[];
  showPastStrikethrough: boolean;
};

export default function LandingEventsList({
  events,
  showPastStrikethrough,
}: LandingEventsListProps) {
  return (
    <div className="space-y-0">
      {events.map((event) => (
        <LandingEventItem
          key={event.id}
          event={event}
          showPastStrikethrough={showPastStrikethrough}
        />
      ))}
    </div>
  );
}
