import type { SitePreference } from "@/features/settings/types";
import type { PreferenceValue } from "../api/landing-page-preferences-api";

export function usePreferenceValue(
  key: string,
  localValues: PreferenceValue,
  preferences: SitePreference[] | undefined
): any {
  return localValues[key] ?? preferences?.find((p) => p.key === key)?.value;
}
