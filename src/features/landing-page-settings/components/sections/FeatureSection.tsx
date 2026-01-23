import { Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { SitePreference } from "@/features/settings/types";
import { PreferenceField } from "../fields/PreferenceField";

interface FeatureSectionProps {
  preferences: SitePreference[];
  getPreferenceValue: (key: string) => any;
  handleValueChange: (key: string, value: any) => void;
  updateMutation: { isPending: boolean };
  albums?: any[];
  albumsLoading?: boolean;
}

export function FeatureSection({
  preferences,
  getPreferenceValue,
  handleValueChange,
  updateMutation,
  albums,
  albumsLoading,
}: FeatureSectionProps) {
  if (preferences.length === 0) return null;

  const showPref = preferences.find((p) => p.key === "feature_section_show");
  const showValue = getPreferenceValue("feature_section_show");

  return (
    <div className="space-y-4 border-b border-border/50 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Feature</h3>
        </div>
        {showPref && (
          <Switch
            checked={showValue === true || showValue === "true"}
            onCheckedChange={(checked) => {
              handleValueChange("feature_section_show", checked);
            }}
            disabled={updateMutation.isPending}
          />
        )}
      </div>

      {preferences
        .filter((pref) => !pref.key.includes("section_order") && !pref.key.includes("section_show"))
        .map((pref) => {
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
  );
}
