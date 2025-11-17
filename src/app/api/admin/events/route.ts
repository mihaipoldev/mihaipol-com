import { NextRequest } from "next/server";
import { createEvent, updateEvent, deleteEvent } from "@/features/events/mutations";
import { eventCreateSchema, eventUpdateSchema } from "@/features/events/schemas";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = eventCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const eventData = {
      ...parsed.data,
      date: parsed.data.date || new Date().toISOString().split("T")[0],
      event_status: (parsed.data.event_status || "upcoming") as "upcoming" | "past" | "cancelled",
      publish_status: (parsed.data.publish_status || "draft") as
        | "draft"
        | "scheduled"
        | "published"
        | "archived",
    };
    const data = await createEvent(eventData);
    return created(data);
  } catch (error: any) {
    console.error("Error creating event:", error);
    return serverError("Failed to create event", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = eventUpdateSchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());
    const { id, ...updates } = parsed.data;
    const data = await updateEvent(id, updates);
    return ok(data);
  } catch (error: any) {
    console.error("Error updating event:", error);
    return serverError("Failed to update event", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return badRequest("Missing event id");
    await deleteEvent(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting event:", error);
    return serverError("Failed to delete event", error?.message);
  }
}
