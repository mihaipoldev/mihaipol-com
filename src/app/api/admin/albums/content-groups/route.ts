import { NextRequest } from "next/server";
import { getAlbumContentGroups } from "@/features/albums/data";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("albumId");

    if (!albumId) {
      return badRequest("albumId is required");
    }

    const groups = await getAlbumContentGroups(albumId);
    return ok(groups);
  } catch (error: any) {
    console.error("Error fetching album content groups:", error);
    return serverError("Failed to fetch content groups", error?.message);
  }
}
