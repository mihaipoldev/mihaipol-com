import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchLandingPagePreferences,
  updateLandingPagePreferencesBatch,
  fetchAlbumsForPreferences,
  type Album,
} from "../api/landing-page-preferences-api";
import type { SitePreference } from "@/features/settings/types";

export function useLandingPagePreferences() {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ["site-preferences"],
    queryFn: fetchLandingPagePreferences,
  });

  const { data: albums, isLoading: albumsLoading } = useQuery({
    queryKey: ["albums-list"],
    queryFn: fetchAlbumsForPreferences,
  });

  const updateMutation = useMutation({
    mutationFn: (updates: { key: string; value: any }[]) => updateLandingPagePreferencesBatch(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-preferences"] });
    },
    onError: (error: Error) => {
      throw error; // Re-throw so handleSaveAll can handle it
    },
  });

  return {
    preferences,
    isLoading,
    albums,
    albumsLoading,
    updateMutation,
  };
}
