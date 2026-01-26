import { NextRequest } from "next/server";
import {
  createAlbumImage,
  updateAlbumImage,
  deleteAlbumImage,
  batchUpdateAlbumImages,
} from "@/features/albums/mutations";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const albumImageCreateSchema = z.object({
  album_id: z.string().uuid(),
  title: z.string().nullable().optional(),
  image_url: z.string().url(),
  crop_shape: z.enum(["circle", "square"]),
  content_type: z.string().nullable().optional(),
  content_group: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const albumImageUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  image_url: z.string().url().optional(),
  crop_shape: z.enum(["circle", "square"]).optional(),
  content_type: z.string().nullable().optional(),
  content_group: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const batchUpdateImagesSchema = z.object({
  albumId: z.string().uuid(),
  images: z.array(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().nullable().optional(),
      image_url: z.string().url(),
      crop_shape: z.enum(["circle", "square"]),
      content_type: z.string().nullable().optional(),
      content_group: z.string().nullable().optional(),
      is_public: z.boolean().optional(),
      sort_order: z.number().int().min(0),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const json = await request.json();

    // Check if this is a batch update
    const batchParsed = batchUpdateImagesSchema.safeParse(json);
    if (batchParsed.success) {
      await batchUpdateAlbumImages(batchParsed.data.albumId, batchParsed.data.images);
      return ok({ success: true });
    }

    // Otherwise, create a single image
    const parsed = albumImageCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const data = await createAlbumImage(parsed.data);
    return created(data);
  } catch (error: any) {
    console.error("Error creating/updating album images:", error);
    return serverError("Failed to create/update album images", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const json = await request.json();
    const parsed = albumImageUpdateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { id, ...updates } = parsed.data;
    const data = await updateAlbumImage(id, updates);
    return ok(data);
  } catch (error: any) {
    console.error("Error updating album image:", error);
    return serverError("Failed to update album image", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return badRequest("Missing album image id");
    }

    await deleteAlbumImage(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting album image:", error);
    return serverError("Failed to delete album image", error?.message);
  }
}
