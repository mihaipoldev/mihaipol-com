import { NextRequest } from "next/server";
import { getAlbumImages, getAlbumAudios } from "@/features/albums/data";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Get album images and audios for a specific album
 * Used for lazy loading content when needed (e.g., in automations configuration panel)
 */
export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("album_id");

    if (!albumId) {
      return badRequest("album_id query parameter is required");
    }

    // Fetch images and audios in parallel
    const [images, audios] = await Promise.all([
      getAlbumImages(albumId),
      getAlbumAudios(albumId),
    ]);

    return ok({
      images,
      audios,
    });
  } catch (error: any) {
    console.error("Error fetching album content:", error);
    return serverError("Failed to fetch album content", error?.message);
  }
}
