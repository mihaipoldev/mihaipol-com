import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function createEvent(eventData: {
  title: string;
  slug: string;
  description?: string | null;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  date: string;
  tickets_url?: string | null;
  ticket_label?: string | null;
  flyer_image_url?: string | null;
  event_status: "upcoming" | "past" | "cancelled";
  publish_status: "draft" | "scheduled" | "published" | "archived";
}) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase.from("events").insert(eventData).select().single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating event:", error);
    throw error;
  }
}

export async function updateEvent(id: string, updates: any) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function deleteEvent(id: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}
