import { NextRequest } from "next/server";
import { ok, created, badRequest, serverError, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { linkFolderSchema, createFolderSchema, updateFolderSchema } from "@/features/google-drive/schemas";
import {
  linkAlbumFolder,
  unlinkAlbumFolder,
  updateAlbumDriveFolder,
} from "@/features/google-drive/mutations";
import {
  validateFolderUrl,
  createAlbumFolder,
  updateAlbumFolder,
  getFolderById,
} from "@/features/google-drive/service";
import { getAlbumById } from "@/features/albums/data";
import type { Album } from "@/features/albums/types";

// GET - Get folder status and info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { albumId: id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return badRequest("User not authenticated");
    }

    // Get album with Drive info
    const album = await getAlbumById(id);
    if (!album) {
      return notFound("Album not found");
    }

    let folderInfo = null;
    if (album.drive_folder_id) {
      try {
        const folder = await getFolderById(album.drive_folder_id, user.id);
        folderInfo = {
          folder_id: folder.folder_id,
          folder_url: folder.folder_url,
          folder_name: folder.folder_name,
        };
      } catch (error: any) {
        // Folder might have been deleted, return null
        folderInfo = null;
      }
    }

    return ok({
      hasFolder: !!album.drive_folder_id,
      folderInfo,
    });
  } catch (error: any) {
    console.error("Error getting folder status:", error);
    return serverError("Failed to get folder status", error?.message);
  }
}

// POST - Create new folder OR link existing folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { albumId: id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return badRequest("User not authenticated");
    }

    // Safely parse JSON body - default to empty object if no body
    let json = {};
    try {
      const text = await request.text();
      if (text) {
        json = JSON.parse(text);
      }
    } catch (e) {
      // If parsing fails, json remains empty object
      // This is fine for create folder requests which have no body
    }

    // Check if this is a manual link request
    if (json.folder_url) {
      const parsed = linkFolderSchema.safeParse(json);
      if (!parsed.success) {
        return badRequest("Invalid payload", parsed.error.flatten());
      }

      // Validate and link existing folder
      const folderInfo = await validateFolderUrl(parsed.data.folder_url, user.id);
      await linkAlbumFolder(id, folderInfo.folder_id, folderInfo.folder_url);

      return created({
        success: true,
        folder_id: folderInfo.folder_id,
        folder_url: folderInfo.folder_url,
        folder_name: folderInfo.folder_name,
        message: `Folder "${folderInfo.folder_name}" linked successfully`,
      });
    }

    // Otherwise, create new folder
    const parsed = createFolderSchema.safeParse({ album_id: id });
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    // Get album data
    const album = await getAlbumById(id);
    if (!album) {
      return notFound("Album not found");
    }

    // Check if folder already exists
    if (album.drive_folder_id) {
      return badRequest("Album already has a linked folder. Use PUT to update or unlink first.");
    }

    // Create folder
    const folder = await createAlbumFolder(
      {
        title: album.title,
        release_date: album.release_date || null,
      },
      user.id
    );

    // Link folder to album
    await linkAlbumFolder(id, folder.folderId, folder.folderUrl);

    return created({
      success: true,
      folder_id: folder.folderId,
      folder_url: folder.folderUrl,
      message: "Folder created and linked successfully",
    });
  } catch (error: any) {
    console.error("Error creating/linking folder:", error);
    return serverError(error.message || "Failed to create/link folder", error?.message);
  }
}

// PUT - Update folder (rename/move) OR link new folder
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { albumId: id } = await params;
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return badRequest("User not authenticated");
    }

    const json = await request.json();

    // Check if this is a manual link update request
    if (json.folder_url) {
      const parsed = linkFolderSchema.safeParse(json);
      if (!parsed.success) {
        return badRequest("Invalid payload", parsed.error.flatten());
      }

      // Validate and link new folder
      const folderInfo = await validateFolderUrl(parsed.data.folder_url, user.id);
      await updateAlbumDriveFolder(id, folderInfo.folder_id, folderInfo.folder_url);

      return ok({
        success: true,
        folder_id: folderInfo.folder_id,
        folder_url: folderInfo.folder_url,
        folder_name: folderInfo.folder_name,
        message: `Folder "${folderInfo.folder_name}" linked successfully`,
      });
    }

    // Otherwise, update existing folder (rename/move)
    const parsed = updateFolderSchema.safeParse({ ...json, album_id: id });
    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    // Get current album data
    const album = await getAlbumById(id);
    if (!album) {
      return notFound("Album not found");
    }

    if (!album.drive_folder_id) {
      return badRequest("Album does not have a linked folder. Use POST to create or link one.");
    }

    // Update folder
    const updated = await updateAlbumFolder(
      id,
      album as Album,
      {
        title: parsed.data.title,
        release_date: parsed.data.release_date,
      },
      user.id
    );

    if (updated) {
      // Update database with new folder info if folder was moved
      await updateAlbumDriveFolder(id, updated.folderId, updated.folderUrl);
      return ok({
        success: true,
        folder_id: updated.folderId,
        folder_url: updated.folderUrl,
        message: "Folder updated successfully",
      });
    }

    return ok({
      success: true,
      message: "No changes needed",
    });
  } catch (error: any) {
    console.error("Error updating folder:", error);
    return serverError(error.message || "Failed to update folder", error?.message);
  }
}

// DELETE - Unlink folder (does NOT delete folder in Drive)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { albumId: id } = await params;

    // Unlink folder from album
    await unlinkAlbumFolder(id);

    return ok({
      success: true,
      message: "Folder unlinked successfully. The folder and files remain in Google Drive.",
    });
  } catch (error: any) {
    console.error("Error unlinking folder:", error);
    return serverError("Failed to unlink folder", error?.message);
  }
}
