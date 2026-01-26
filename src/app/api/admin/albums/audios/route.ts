import { NextRequest } from "next/server";
import {
  createAlbumAudio,
  updateAlbumAudio,
  deleteAlbumAudio,
  batchUpdateAlbumAudios,
} from "@/features/albums/mutations";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const albumAudioCreateSchema = z.object({
  album_id: z.string().uuid(),
  title: z.string().nullable().optional(),
  audio_url: z.string().url(),
  duration: z.number().int().min(0).nullable().optional(),
  file_size: z.number().int().min(0).nullable().optional(),
  highlight_start_time: z.number().nullable().optional(),
  content_group: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const albumAudioUpdateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().nullable().optional(),
  audio_url: z.string().url().optional(),
  duration: z.number().int().min(0).nullable().optional(),
  file_size: z.number().int().min(0).nullable().optional(),
  highlight_start_time: z.number().nullable().optional(),
  content_group: z.string().nullable().optional(),
  is_public: z.boolean().optional(),
  sort_order: z.number().int().min(0).optional(),
});

const batchUpdateAudiosSchema = z.object({
  albumId: z.string().uuid(),
  audios: z.array(
    z.object({
      id: z.string().uuid().optional(),
      title: z.string().nullable().optional(),
      audio_url: z.string().url(),
      duration: z.number().int().min(0).nullable().optional(),
      file_size: z.number().int().min(0).nullable().optional(),
      highlight_start_time: z.number().nullable().optional(),
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
    const batchParsed = batchUpdateAudiosSchema.safeParse(json);
    if (batchParsed.success) {
      await batchUpdateAlbumAudios(batchParsed.data.albumId, batchParsed.data.audios);
      return ok({ success: true });
    }

    // Otherwise, create a single audio
    const parsed = albumAudioCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const data = await createAlbumAudio(parsed.data);
    return created(data);
  } catch (error: any) {
    console.error("Error creating/updating album audios:", error);
    return serverError("Failed to create/update album audios", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const json = await request.json();
    const parsed = albumAudioUpdateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { id, ...updates } = parsed.data;
    const data = await updateAlbumAudio(id, updates);
    return ok(data);
  } catch (error: any) {
    console.error("Error updating album audio:", error);
    return serverError("Failed to update album audio", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return badRequest("Missing album audio id");
    }

    await deleteAlbumAudio(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting album audio:", error);
    return serverError("Failed to delete album audio", error?.message);
  }
}
