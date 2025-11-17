import { NextRequest } from "next/server";
import { createArtist, updateArtist, deleteArtist } from "@/features/artists/mutations";
import { artistCreateSchema, artistUpdateSchema } from "@/features/artists/schemas";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

function normalizeArtistPayload(payload: any) {
  return {
    ...payload,
    profile_image_url: payload.profile_image_url || payload.image_url || null,
    city: payload.city || null,
    country: payload.country || null,
    // Remove image_url if it exists to avoid confusion
    ...(payload.image_url && !payload.profile_image_url ? {} : { image_url: undefined }),
  };
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = artistCreateSchema.safeParse(normalizeArtistPayload(json));
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());
    const data = await createArtist(parsed.data);
    return created(data);
  } catch (error: any) {
    console.error("Error creating artist:", error);
    return serverError("Failed to create artist", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const normalized = normalizeArtistPayload(json);
    const parsed = artistUpdateSchema.safeParse(normalized);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const { id, ...updates } = parsed.data;
    const data = await updateArtist(id, updates);
    return ok(data);
  } catch (error: any) {
    console.error("Error updating artist:", error);
    return serverError("Failed to update artist", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) return badRequest("Missing artist id");
    await deleteArtist(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting artist:", error);
    return serverError("Failed to delete artist", error?.message);
  }
}
