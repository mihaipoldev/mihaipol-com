import { NextRequest } from "next/server";
import { createAlbum, updateAlbum, deleteAlbum } from "@/features/albums/mutations";
import { albumCreateSchema, albumUpdateSchema } from "@/features/albums/schemas";
import { getAllAlbumsWithLabels } from "@/features/albums/data";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    // Fetch all albums (including unpublished) for admin selection
    const albums = await getAllAlbumsWithLabels();
    
    // Return simplified album list for selection
    const albumList = albums.map((album) => ({
      id: album.id,
      title: album.title,
      slug: album.slug,
      release_date: album.release_date,
      publish_status: album.publish_status,
      labelName: album.labels?.name || null,
      cover_image_url: album.cover_image_url || null,
    }));

    return ok(albumList);
  } catch (error: any) {
    console.error("Error fetching albums:", error);
    return serverError("Failed to fetch albums", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = albumCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const albumData = {
      ...parsed.data,
      publish_status: (parsed.data.publish_status || "draft") as
        | "draft"
        | "scheduled"
        | "published"
        | "archived",
    };
    const data = await createAlbum(albumData);
    return created(data);
  } catch (error: any) {
    console.error("Error creating album:", error);
    return serverError("Failed to create album", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = albumUpdateSchema.safeParse(json);
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten());
    const { id, ...updates } = parsed.data;

    // Get old album data before updating (for Drive folder updates)
    const { getAlbumById } = await import("@/features/albums/data");
    const oldAlbum = await getAlbumById(id);

    // Update album in database
    const data = await updateAlbum(id, updates);

    // Update Drive folder if title or release_date changed (non-blocking)
    if (oldAlbum && (updates.title !== undefined || updates.release_date !== undefined)) {
      // Check if title or release_date actually changed
      const titleChanged = updates.title !== undefined && updates.title !== oldAlbum.title;
      const releaseDateChanged =
        updates.release_date !== undefined &&
        updates.release_date !== oldAlbum.release_date;

      if ((titleChanged || releaseDateChanged) && oldAlbum.drive_folder_id) {
        // Update Drive folder asynchronously - don't block the response
        // Use setImmediate or Promise.resolve().then() to run after response is sent
        Promise.resolve()
          .then(async () => {
            try {
              const { updateAlbumDriveFolder } = await import("@/features/google-drive/mutations");
              const { updateAlbumFolder } = await import("@/features/google-drive/service");
              const { getSupabaseServer } = await import("@/lib/supabase-ssr");

              // Get current user for Drive API
              const supabase = await getSupabaseServer();
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (!user) {
                console.warn("No user found for Drive folder update");
                return;
              }

              // Update the folder in Drive
              const folderUpdate = await updateAlbumFolder(
                id,
                oldAlbum as any,
                {
                  title: updates.title,
                  release_date: updates.release_date,
                },
                user.id
              );

              // If folder was updated, save new folder info to database
              if (folderUpdate) {
                await updateAlbumDriveFolder(id, folderUpdate.folderId, folderUpdate.folderUrl);
                console.log("Drive folder updated successfully:", folderUpdate);
              }
            } catch (driveError: any) {
              // Log error but don't throw - album update already succeeded
              console.error("Error updating Drive folder (non-blocking):", {
                albumId: id,
                error: driveError.message,
                stack: driveError.stack,
              });
              // Optionally, you could store this error in a queue for retry later
            }
          })
          .catch((error) => {
            console.error("Unexpected error in Drive folder update:", error);
          });
      }
    }

    return ok(data);
  } catch (error: any) {
    console.error("Error updating album:", error);
    return serverError("Failed to update album", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return badRequest("Missing album id");
    }
    await deleteAlbum(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting album:", error);
    return serverError("Failed to delete album", error?.message);
  }
}
