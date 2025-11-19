import { supabase } from "@/lib/supabase";
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
    // 🐛 DEBUG: Start timing
    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    // Select only needed columns
    let query = supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, tickets_url, ticket_label"
      );

    // Filter by publish status first (matches index column order)
    // Uses: idx_events_publish_status_date when status="all"
    // Uses: idx_events_status_date when status="upcoming" or "past"
    if (!includeUnpublished) {
      query = query.eq("publish_status", "published");
    }

    // Filter by start date if provided (for last 2 weeks)
    if (startDate) {
      query = query.gte("date", startDate);
      console.log(`🔍 [DB] Applying date filter: date >= ${startDate}`);
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

    // 🐛 DEBUG: Log query time
    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    const dataCount = data?.length || 0;
    console.log(
      `🔍 [DB] events query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`
    );

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: events fetch took ${queryTime.toFixed(0)}ms`);
    }

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

  // Debug logging
  console.log(
    `📅 [Events] Filtering events from ${startDateISO} onwards (${daysBack} days ago from today)`
  );

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

  if (filteredEvents.length !== events.length) {
    console.warn(
      `⚠️ [Events] Filtered out ${events.length - filteredEvents.length} events that were outside the ${daysBack}-day window`
    );
  }

  return filteredEvents;
}

export async function getAllEvents() {
  return fetchEvents({ status: "all", order: "asc" });
}

export async function getEventBySlug(slug: string) {
  try {
    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    // Query optimized for: idx_events_slug_publish_status (partial index on published)
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url"
      )
      .eq("slug", slug)
      .eq("publish_status", "published")
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] event by slug query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}

// Admin data fetching functions (returns all events including unpublished)
export async function getAllEventsUnfiltered() {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url"
      )
      .order("date", { ascending: false });

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    const dataCount = data?.length || 0;
    console.log(
      `🔍 [DB] all events (unfiltered) query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`
    );

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: all events (unfiltered) took ${queryTime.toFixed(0)}ms`);
    }

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all events:", error);
    return [];
  }
}

export async function getEventById(id: string) {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url"
      )
      .eq("id", id)
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] event by id query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching event by id:", error);
    return null;
  }
}

export async function getEventBySlugAdmin(slug: string) {
  try {
    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const queryStartTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url"
      )
      .eq("slug", slug)
      .single();

    const queryTime =
      (typeof performance !== "undefined" ? performance.now() : Date.now()) - queryStartTime;
    console.log(`🔍 [DB] event by slug (admin) query completed in ${queryTime.toFixed(0)}ms`);

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error("Error fetching event by slug (admin):", error);
    return null;
  }
}
