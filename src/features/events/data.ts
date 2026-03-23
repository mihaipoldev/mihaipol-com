import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getServiceSupabaseClient } from "@/lib/supabase/server";
import { getSitePreferenceNumber } from "@/features/settings/data";

type FetchEventsOptions = {
  status?: "upcoming" | "past" | "all";
  limit?: number;
  order?: "asc" | "desc";
  includeUnpublished?: boolean;
  startDate?: string;
};

async function fetchEvents(options: FetchEventsOptions = {}) {
  const { status = "all", limit, order = "asc", includeUnpublished = false, startDate } = options;

  try {
    const supabase = await getSupabaseServer();
    // Select only needed columns
    let query = supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, flyer_media:media!flyer_media_id(id, url), description, tickets_url, ticket_label"
      )
      .is("deleted_at", null);

    // Filter by publish status first (matches index column order)
    // Uses: idx_events_publish_status_date when status="all"
    // Uses: idx_events_status_date when status="upcoming" or "past"
    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    // Filter by start date if provided (for last 2 weeks)
    if (startDate) {
      query = query.gte("date", startDate);
    }

    // Filter by event status and date (optimized for idx_events_status_date)
    if (status === "upcoming") {
      query = query
        .eq("event_status", "upcoming")
        .gte("date", new Date().toISOString().split("T")[0]);
    } else if (status === "past") {
      const today = new Date().toISOString().split("T")[0];
      query = query.or(`event_status.eq.past,date.lt.${today}`);
    }

    // Order by date (matches index ordering)
    query = query.order("date", { ascending: order === "asc" });

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching events:", error);
    return [];
  }
}

export async function getHomepageEvents(limit?: number) {
  // Get preferences for events
  const daysBack = await getSitePreferenceNumber("events_homepage_days_back", 14);
  const defaultLimit = await getSitePreferenceNumber("events_homepage_limit", 4);
  const actualLimit = limit ?? defaultLimit;

  // Get events from the specified days back to future
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - daysBack);
  startDate.setHours(0, 0, 0, 0); // Ensure it's at start of day
  const startDateISO = startDate.toISOString().split("T")[0];

  // Fetch events from specified days back onwards, ordered by date ascending
  const events = await fetchEvents({
    status: "all",
    limit: actualLimit,
    order: "asc",
    startDate: startDateISO,
  });

  // Additional client-side filter as safety check
  const filteredEvents = events.filter((event) => {
    if (!event.date) return false;
    const eventDate = new Date(event.date);
    return eventDate >= startDate;
  });

  return filteredEvents;
}

export async function getAllEvents() {
  return fetchEvents({ status: "all", order: "asc" });
}

export async function getEventBySlug(slug: string, includeUnpublished = false) {
  try {
    const supabase = includeUnpublished ? getServiceSupabaseClient() : await getSupabaseServer();
    let query = supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, flyer_media:media!flyer_media_id(id, url), description, ticket_label, tickets_url"
      )
      .is("deleted_at", null)
      .eq("slug", slug);

    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}

