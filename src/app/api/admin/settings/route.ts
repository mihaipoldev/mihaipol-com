import { NextRequest } from "next/server";
import { updateStyleColor } from "@/features/settings/mutations";
import { ok, badRequest, serverError, unauthorized } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateStyleColorSchema = z.object({
  style_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid hex color format"),
});

export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return unauthorized("You must be logged in to update settings");
    }

    const json = await request.json();
    const parsed = updateStyleColorSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    await updateStyleColor(user.id, parsed.data.style_color);

    return ok({ success: true, style_color: parsed.data.style_color });
  } catch (error: any) {
    console.error("Error updating style color:", error);
    return serverError("Failed to update style color", error?.message);
  }
}
