"use client";

import EventItem from "../items/EventItem";
import StaggerContainer from "../animations/StaggerContainer";
import type { LandingEvent } from "../types";

type EventsListProps = {
  events: LandingEvent[];
  showPastStrikethrough: boolean;
};

export default function EventsList({
  events,
  showPastStrikethrough,
}: EventsListProps) {
  return (
    <StaggerContainer className="space-y-0">
      {events.map((event) => (
        <EventItem
          key={event.id}
          event={event}
          showPastStrikethrough={showPastStrikethrough}
        />
      ))}
    </StaggerContainer>
  );
}
