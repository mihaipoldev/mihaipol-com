import { Palette } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { SitePreference } from "@/features/settings/types";
import { PreferenceField } from "../fields/PreferenceField";
import { SectionOrderManager } from "../SectionOrderManager";

interface GeneralSectionProps {
  preferences: SitePreference[];
  getPreferenceValue: (key: string) => any;
  handleValueChange: (key: string, value: any) => void;
  updateMutation: { isPending: boolean };
  getSectionData: () => any[];
  handleSectionOrderChange: (updatedSections: any[]) => void;
  albums?: any[];
  albumsLoading?: boolean;
}

export function GeneralSection({
  preferences,
  getPreferenceValue,
  handleValueChange,
  updateMutation,
  getSectionData,
  handleSectionOrderChange,
  albums,
  albumsLoading,
}: GeneralSectionProps) {
  if (preferences.length === 0) return null;

  // Separate preset preferences from other preferences
  const presetPreferences = preferences.filter(
    (p) => p.key === "landing_page_preset_number" || p.key === "landing_page_preset_prod"
  );
  const otherPreferences = preferences.filter(
    (p) => p.key !== "landing_page_preset_number" && p.key !== "landing_page_preset_prod"
  );

  return (
    <div className="space-y-4 border-b border-border/50 pb-4">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">General</h3>
      </div>

      {/* Presets stacked vertically */}
      {presetPreferences.length > 0 && (
        <div className="space-y-4">
          {presetPreferences.map((pref) => {
            const value = getPreferenceValue(pref.key);
            return (
              <PreferenceField
                key={pref.key}
                preference={pref}
                value={value}
                onChange={handleValueChange}
                disabled={updateMutation.isPending}
                getPreferenceValue={getPreferenceValue}
                albums={albums}
                albumsLoading={albumsLoading}
              />
            );
          })}
        </div>
      )}

      {/* Other preferences */}
      {otherPreferences.map((pref) => {
        const value = getPreferenceValue(pref.key);
        return (
          <PreferenceField
            key={pref.key}
            preference={pref}
            value={value}
            onChange={handleValueChange}
            disabled={updateMutation.isPending}
            getPreferenceValue={getPreferenceValue}
            albums={albums}
            albumsLoading={albumsLoading}
          />
        );
      })}

      {/* Section Order Manager */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="flex-1">
          <Label className="text-sm font-medium">
            Section Display Order
          </Label>
          <p className="text-xs text-muted-foreground mt-1">Reorder sections on the homepage</p>
        </div>
        <div className="flex items-center gap-3">
          <SectionOrderManager
            sections={getSectionData()}
            onOrderChange={handleSectionOrderChange}
            disabled={updateMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}
