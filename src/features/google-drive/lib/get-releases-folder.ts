import { getSitePreference } from "@/features/settings/data";

export async function getReleasesFolderId(): Promise<string> {
  const setting = await getSitePreference("drive_releases_folder_id");
  if (!setting) {
    throw new Error(
      "Drive Releases folder not configured. Please set it in Settings > Integrations."
    );
  }
  const parsed = typeof setting === "string" ? JSON.parse(setting) : setting;
  const folderId = parsed?.folderId;
  
  if (!folderId || typeof folderId !== "string" || folderId.trim() === "") {
    throw new Error(
      "Drive Releases folder not configured. Please set it in Settings > Integrations."
    );
  }
  
  return folderId.trim();
}
