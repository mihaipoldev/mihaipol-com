import type { SitePreference } from "@/features/settings/types";

export type PreferenceValue = {
  [key: string]: any;
};

export type Album = {
  id: string;
  title: string;
  slug: string;
  release_date: string | null;
  publish_status: string;
  labelName: string | null;
  cover_image_url: string | null;
};

export async function fetchLandingPagePreferences(): Promise<SitePreference[]> {
  const response = await fetch("/api/admin/settings/preferences");
  if (!response.ok) {
    throw new Error("Failed to fetch preferences");
  }
  return response.json();
}

export async function updateLandingPagePreference(key: string, value: any): Promise<void> {
  const response = await fetch("/api/admin/settings/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key, value }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update preference");
  }
}

export async function updateLandingPagePreferencesBatch(updates: { key: string; value: any }[]): Promise<void> {
  // Update all preferences in parallel
  await Promise.all(updates.map(({ key, value }) => updateLandingPagePreference(key, value)));
}

export async function fetchAlbumsForPreferences(): Promise<Album[]> {
  const response = await fetch("/api/admin/albums");
  if (!response.ok) {
    throw new Error("Failed to fetch albums");
  }
  return response.json();
}
