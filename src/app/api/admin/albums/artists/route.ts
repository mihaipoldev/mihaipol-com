import { NextRequest } from "next/server";
import { batchUpdateAlbumArtists } from "@/features/albums/mutations";
import { getAlbumArtists } from "@/features/albums/data";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const batchUpdateArtistsSchema = z.object({
  albumId: z.string().uuid(),
  artists: z.array(
    z.object({
      id: z.string().uuid().optional(),
      artist_id: z.string().uuid(),
      role: z.enum(["primary", "featured", "remixer"]),
      sort_order: z.number().int().min(0),
    })
  ),
});

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");

    if (!albumId) {
      return badRequest("albumId is required");
    }

    const artists = await getAlbumArtists(albumId);
    return ok(artists);
  } catch (error: any) {
    console.error("Error fetching album artists:", error);
    return serverError("Failed to fetch album artists", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = batchUpdateArtistsSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    await batchUpdateAlbumArtists(parsed.data.albumId, parsed.data.artists);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error batch updating album artists:", error);
    return serverError("Failed to update album artists", error?.message);
  }
}
