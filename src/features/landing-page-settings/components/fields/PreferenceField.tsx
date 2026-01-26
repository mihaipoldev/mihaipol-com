import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SitePreference } from "@/features/settings/types";
import type { Album } from "../../api/landing-page-preferences-api";
import { PreferenceRow } from "./PreferenceRow";
import { LandingPagePresetSelect } from "./LandingPagePresetSelect";
import { FeaturedAlbumSelect } from "./FeaturedAlbumSelect";
import {
  EVENTS_LIMIT_OPTIONS,
  COLUMN_OPTIONS,
  DAYS_BACK_OPTIONS,
} from "../../utils/preference-constants";
import { getDynamicLimitOptions } from "../../utils/preference-helpers";
import { toast } from "sonner";

interface PreferenceFieldProps {
  preference: SitePreference;
  value: any;
  onChange: (key: string, value: any) => void;
  disabled?: boolean;
  getPreferenceValue: (key: string) => any;
  albums?: Album[];
  albumsLoading?: boolean;
  updateMutation?: { mutateAsync: (updates: { key: string; value: any }[]) => Promise<any>; isPending: boolean };
}

export function PreferenceField({
  preference,
  value,
  onChange,
  disabled,
  getPreferenceValue,
  albums,
  albumsLoading,
  updateMutation,
}: PreferenceFieldProps) {
  // Special handling for landing page preset selector (dev and prod)
  if (preference.key === "landing_page_preset_number" || 
      preference.key === "landing_page_preset_prod") {
    const label = preference.key.includes("prod") 
      ? "Production Preset" 
      : "Dev Preset";
    
    const isDevPreset = preference.key === "landing_page_preset_number";
    
    // Handle dev preset: save immediately
    const handlePresetChange = async (newValue: any) => {
      if (isDevPreset && updateMutation) {
        // Save dev preset immediately
        try {
          // Process the preset value (same logic as in PreferencesSettings)
          let processedValue: any = newValue;
          if (typeof newValue === "object" && newValue !== null && "id" in newValue) {
            const preset = newValue as any;
            if (
              typeof preset.id === "number" &&
              typeof preset.name === "string" &&
              typeof preset.primary === "string" &&
              typeof preset.secondary === "string" &&
              typeof preset.accent === "string"
            ) {
              processedValue = {
                id: preset.id,
                name: preset.name,
                primary: preset.primary,
                secondary: preset.secondary,
                accent: preset.accent,
                favorite: preset.favorite ?? false,
              };
            }
          }
          
          await updateMutation.mutateAsync([{ key: preference.key, value: processedValue }]);
          // Also update local state so UI reflects the change immediately
          onChange(preference.key, newValue);
          toast.success("Dev preset updated");
        } catch (error: any) {
          console.error("Error saving dev preset:", error);
          toast.error(error.message || "Failed to save dev preset");
          // Still update local state for UI feedback, but user will see error
          onChange(preference.key, newValue);
        }
      } else {
        // Production preset: use normal onChange (requires save)
        onChange(preference.key, newValue);
      }
    };
    
    return (
      <PreferenceRow
        label={label}
        description={preference.description || preference.key}
        keyName={preference.key}
      >
        <LandingPagePresetSelect
          value={value}
          onChange={handlePresetChange}
          disabled={disabled || (isDevPreset && updateMutation?.isPending)}
        />
      </PreferenceRow>
    );
  }

  // Special handling for featured album selector
  if (preference.key === "featured_album_id") {
    return (
      <PreferenceRow
        label="Featured album"
        description={preference.key}
        keyName={preference.key}
      >
        <FeaturedAlbumSelect
          value={value}
          onChange={(newValue) => onChange(preference.key, newValue)}
          disabled={disabled}
          albums={albums}
          isLoading={albumsLoading}
        />
      </PreferenceRow>
    );
  }

  // Handle events_homepage_limit
  if (preference.key === "events_homepage_limit") {
    return (
      <PreferenceRow
        label={preference.description || preference.key}
        description={preference.description ? preference.key : undefined}
        keyName={preference.key}
      >
        <Select
          value={String(value ?? EVENTS_LIMIT_OPTIONS[0])}
          onValueChange={(newValue) => onChange(preference.key, newValue)}
          disabled={disabled}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {EVENTS_LIMIT_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceRow>
    );
  }

  // Handle events_homepage_days_back
  if (preference.key === "events_homepage_days_back") {
    const currentValue = Number(value) ?? DAYS_BACK_OPTIONS[0].value;
    return (
      <PreferenceRow
        label={preference.description || preference.key}
        description={preference.description ? preference.key : undefined}
        keyName={preference.key}
      >
        <Select
          value={String(currentValue)}
          onValueChange={(newValue) => onChange(preference.key, newValue)}
          disabled={disabled}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {DAYS_BACK_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceRow>
    );
  }

  // Handle column fields
  const columnFields = [
    "albums_homepage_columns",
    "albums_page_columns",
    "griffith_albums_homepage_columns",
    "updates_homepage_columns",
    "updates_page_columns",
  ];
  if (columnFields.includes(preference.key)) {
    return (
      <PreferenceRow
        label={preference.description || preference.key}
        description={preference.description ? preference.key : undefined}
        keyName={preference.key}
      >
        <Select
          value={String(value ?? COLUMN_OPTIONS[0])}
          onValueChange={(newValue) => onChange(preference.key, newValue)}
          disabled={disabled}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {COLUMN_OPTIONS.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceRow>
    );
  }

  // Handle dynamic limit fields
  const dynamicLimitFields = [
    "albums_homepage_limit",
    "griffith_albums_homepage_limit",
    "updates_homepage_limit",
  ];
  if (dynamicLimitFields.includes(preference.key)) {
    let columnsKey: string;
    if (preference.key === "albums_homepage_limit") {
      columnsKey = "albums_homepage_columns";
    } else if (preference.key === "griffith_albums_homepage_limit") {
      columnsKey = "griffith_albums_homepage_columns";
    } else {
      columnsKey = "updates_homepage_columns";
    }

    const columnsValue = Number(getPreferenceValue(columnsKey)) || COLUMN_OPTIONS[0];
    const limitOptions = getDynamicLimitOptions(columnsValue);
    const currentValue = Number(value) ?? limitOptions[0];
    const validValue = limitOptions.includes(currentValue) ? currentValue : limitOptions[0];

    return (
      <PreferenceRow
        label={preference.description || preference.key}
        description={preference.description ? preference.key : undefined}
        keyName={preference.key}
      >
        <Select
          value={String(validValue)}
          onValueChange={(newValue) => onChange(preference.key, newValue)}
          disabled={disabled}
        >
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {limitOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceRow>
    );
  }

  // Handle boolean fields
  const isBoolean =
    typeof preference.value === "boolean" ||
    preference.value === "true" ||
    preference.value === "false";

  if (isBoolean) {
    return (
      <PreferenceRow
        label={preference.description || preference.key}
        description={preference.description ? preference.key : undefined}
        keyName={preference.key}
      >
        <Select
          value={value === true || value === "true" ? "yes" : "no"}
          onValueChange={(newValue) => onChange(preference.key, newValue === "yes")}
          disabled={disabled}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="yes">Yes</SelectItem>
            <SelectItem value="no">No</SelectItem>
          </SelectContent>
        </Select>
      </PreferenceRow>
    );
  }

  // Default: Input (number)
  return (
    <PreferenceRow
      label={preference.description || preference.key}
      description={preference.description ? preference.key : undefined}
      keyName={preference.key}
    >
      <Input
        id={preference.key}
        type="number"
        min={
          preference.key.includes("limit")
            ? 1
            : preference.key.includes("days")
              ? 1
              : preference.key.includes("columns")
                ? 1
                : undefined
        }
        max={
          preference.key.includes("limit")
            ? 20
            : preference.key.includes("days")
              ? 365
              : preference.key.includes("columns")
                ? 7
                : undefined
        }
        value={value ?? ""}
        onChange={(e) => onChange(preference.key, e.target.value)}
        className="w-24"
        disabled={disabled}
      />
    </PreferenceRow>
  );
}
