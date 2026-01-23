import { getServiceSupabaseClient } from "@/lib/supabase/server";

export async function storeOAuthToken(
  userId: string,
  tokenData: {
    access_token: string;
    refresh_token: string;
    expires_at: string;
  }
) {
  try {
    const supabase = getServiceSupabaseClient();
    
    // Check if token already exists
    const { data: existing } = await supabase
      .from("oauth_tokens")
      .select("id")
      .eq("user_id", userId)
      .eq("provider", "google")
      .maybeSingle();

    if (existing) {
      // Update existing token
      const { data, error } = await supabase
        .from("oauth_tokens")
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new token
      const { data, error } = await supabase
        .from("oauth_tokens")
        .insert({
          user_id: userId,
          provider: "google",
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_at: tokenData.expires_at,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error storing OAuth token:", error);
    throw error;
  }
}

export async function linkAlbumFolder(
  albumId: string,
  folderId: string,
  folderUrl: string
) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("albums")
      .update({
        drive_folder_id: folderId,
        drive_folder_url: folderUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", albumId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error linking album folder:", error);
    throw error;
  }
}

export async function unlinkAlbumFolder(albumId: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("albums")
      .update({
        drive_folder_id: null,
        drive_folder_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", albumId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error unlinking album folder:", error);
    throw error;
  }
}

export async function updateAlbumDriveFolder(
  albumId: string,
  folderId: string,
  folderUrl: string
) {
  try {
    const supabase = getServiceSupabaseClient();
    const { data, error } = await supabase
      .from("albums")
      .update({
        drive_folder_id: folderId,
        drive_folder_url: folderUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", albumId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating album Drive folder:", error);
    throw error;
  }
}

export async function deleteOAuthToken(userId: string) {
  try {
    const supabase = getServiceSupabaseClient();
    const { error } = await supabase
      .from("oauth_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("provider", "google");

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting OAuth token:", error);
    throw error;
  }
}
