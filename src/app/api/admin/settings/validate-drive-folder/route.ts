import { NextRequest } from "next/server";
import { ok, badRequest, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getFolderById } from "@/features/google-drive/service";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const searchParams = request.nextUrl.searchParams;
    const folderId = searchParams.get("folderId");

    if (!folderId) {
      return badRequest("Folder ID is required");
    }

    // Validate format (alphanumeric, dashes, underscores)
    const folderIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!folderIdRegex.test(folderId.trim())) {
      return badRequest("Invalid folder ID format");
    }

    // Get current user for Drive API access
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Validate folder exists via Drive API
    try {
      const folderInfo = await getFolderById(folderId.trim(), user.id);
      return ok({
        valid: true,
        folderName: folderInfo.folder_name,
      });
    } catch (error: any) {
      console.error("Folder validation error:", {
        folderId: folderId.trim(),
        error: error.message,
        code: error.code,
      });
      
      // Return the specific error message from the service
      let errorMessage = error.message || "Folder not found in Google Drive or you don't have access";
      
      // If it's a 404, suggest reconnecting
      if (error.code === 404 || error.message?.includes("not found")) {
        errorMessage += " If you recently changed OAuth scopes, please disconnect and reconnect Google Drive.";
      }
      
      return ok({
        valid: false,
        error: errorMessage,
      });
    }
  } catch (error: any) {
    console.error("Error validating Drive folder:", error);
    return serverError("Failed to validate folder", error?.message);
  }
}
