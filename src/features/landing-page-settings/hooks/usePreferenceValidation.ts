import { useEffect } from "react";
import type { PreferenceValue } from "../api/landing-page-preferences-api";
import type { SitePreference } from "@/features/settings/types";
import { COLUMN_OPTIONS } from "../utils/preference-constants";
import { getDynamicLimitOptions } from "../utils/preference-helpers";

export function usePreferenceValidation(
  localValues: PreferenceValue,
  preferences: SitePreference[] | undefined,
  getPreferenceValue: (key: string) => any,
  handleValueChange: (key: string, value: any) => void
) {
  useEffect(() => {
    if (!preferences) return;

    const albumsColumns = Number(getPreferenceValue("albums_homepage_columns")) || COLUMN_OPTIONS[0];
    const griffithColumns = Number(getPreferenceValue("griffith_albums_homepage_columns")) || COLUMN_OPTIONS[0];
    const updatesColumns = Number(getPreferenceValue("updates_homepage_columns")) || COLUMN_OPTIONS[0];

    const updates: { key: string; value: number }[] = [];

    // Albums homepage limit
    const albumsLimit = Number(getPreferenceValue("albums_homepage_limit"));
    const albumsLimitOptions = getDynamicLimitOptions(albumsColumns);
    if (albumsLimit && !albumsLimitOptions.includes(albumsLimit)) {
      updates.push({ key: "albums_homepage_limit", value: albumsLimitOptions[0] });
    }

    // Griffith albums homepage limit
    const griffithLimit = Number(getPreferenceValue("griffith_albums_homepage_limit"));
    const griffithLimitOptions = getDynamicLimitOptions(griffithColumns);
    if (griffithLimit && !griffithLimitOptions.includes(griffithLimit)) {
      updates.push({ key: "griffith_albums_homepage_limit", value: griffithLimitOptions[0] });
    }

    // Updates homepage limit
    const updatesLimit = Number(getPreferenceValue("updates_homepage_limit"));
    const updatesLimitOptions = getDynamicLimitOptions(updatesColumns);
    if (updatesLimit && !updatesLimitOptions.includes(updatesLimit)) {
      updates.push({ key: "updates_homepage_limit", value: updatesLimitOptions[0] });
    }

    if (updates.length > 0) {
      updates.forEach(({ key, value }) => {
        handleValueChange(key, value);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    localValues.albums_homepage_columns,
    localValues.griffith_albums_homepage_columns,
    localValues.updates_homepage_columns,
    preferences,
  ]);
}
