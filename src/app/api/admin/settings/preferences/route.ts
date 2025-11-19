import { NextRequest } from "next/server";
import { getAllSitePreferences } from "@/features/settings/data";
import { updateSitePreference } from "@/features/settings/mutations";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const updatePreferenceSchema = z.object({
  key: z.string().min(1),
  value: z.any(), // JSONB can be any type
});

export async function GET(request: NextRequest) {
  try {
    // Check authentication (admin only for GET, though public read is allowed by RLS)
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const preferences = await getAllSitePreferences();
    return ok(preferences);
  } catch (error: any) {
    console.error("Error fetching preferences:", error);
    return serverError("Failed to fetch preferences", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    const parsed = updatePreferenceSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await updateSitePreference(parsed.data.key, parsed.data.value);

    return ok({ success: true, key: parsed.data.key, value: parsed.data.value });
  } catch (error: any) {
    console.error("Error updating preference:", error);
    return serverError("Failed to update preference", error?.message);
  }
}
