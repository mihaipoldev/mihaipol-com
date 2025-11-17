import { NextRequest } from "next/server";
import { batchUpdateAlbumLinks } from "@/features/albums/mutations";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const batchUpdateLinksSchema = z.object({
  albumId: z.string().uuid(),
  links: z.array(
    z.object({
      id: z.string().uuid().optional(),
      platform_id: z.string().uuid().nullable().optional(),
      url: z.string().url(),
      cta_label: z.string().min(1),
      link_type: z.string().nullable().optional(),
      sort_order: z.number().int().min(0),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = batchUpdateLinksSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    await batchUpdateAlbumLinks(parsed.data.albumId, parsed.data.links);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error batch updating album links:", error);
    return serverError("Failed to update album links", error?.message);
  }
}
