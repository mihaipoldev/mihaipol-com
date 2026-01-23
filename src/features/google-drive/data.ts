import { getServiceSupabaseClient } from "@/lib/supabase/server";
import type { OAuthToken, DriveFolderInfo } from "./types";

export async function getOAuthToken(userId: string): Promise<OAuthToken | null> {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("oauth_tokens")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    if (error) throw error;
    return data as OAuthToken | null;
  } catch (error) {
    console.error("Error fetching OAuth token:", error);
    return null;
  }
}

export async function getAlbumWithDriveInfo(albumId: string) {
  try {
    const { getAlbumById } = await import("@/features/albums/data");
    const album = await getAlbumById(albumId);
    if (!album) {
      throw new Error("Album not found");
    }
    return {
      id: album.id,
      title: album.title,
      release_date: album.release_date,
      drive_folder_id: (album as any).drive_folder_id || null,
      drive_folder_url: (album as any).drive_folder_url || null,
    };
  } catch (error) {
    console.error("Error fetching album with Drive info:", error);
    throw error;
  }
}
