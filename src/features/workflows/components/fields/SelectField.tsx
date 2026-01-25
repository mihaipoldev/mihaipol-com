"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { SelectField as SelectFieldType } from "../../types/form.types";
import { useDataSource } from "../../hooks/useDataSource";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";
import { cn } from "@/lib/utils";

type SelectFieldProps = {
  field: SelectFieldType;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
};

export function SelectField({
  field,
  control,
  errors,
  fieldPath,
  entityType,
  entityId,
  images,
  tracks,
}: SelectFieldProps) {
  const error = errors[field.name]?.message as string | undefined;
  const { data: dataSourceData, isLoading, error: dataSourceError } =
    useDataSource(field.data_source, entityType, entityId, images, tracks);

  // Determine options source
  const options = field.data_source
    ? dataSourceData.map((item) => {
        // Handle images
        if ("image_url" in item) {
          const img = item as AlbumImage;
          return {
            label: img.title || `Image ${img.sort_order + 1}`,
            value: img.id,
            imageUrl: img.image_url,
          };
        }
        // Handle tracks
        if ("audio_url" in item) {
          const track = item as AlbumAudio;
          const trackNum = String(track.sort_order + 1).padStart(2, "0");
          return {
            label: `${trackNum} - ${track.title || `Track ${track.sort_order + 1}`}`,
            value: track.id,
            trackNumber: track.sort_order + 1,
          };
        }
        return { label: String(item), value: String(item) };
      })
    : field.options || [];

  const isEmpty = !isLoading && options.length === 0;
  const emptyMessage = field.data_source
    ? field.data_source.includes("images")
      ? "No images uploaded yet. Add images in the Content tab."
      : field.data_source.includes("tracks")
      ? "No tracks uploaded yet. Add tracks in the Content tab."
      : "No options available"
    : "No options available";

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldPath}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      <Controller
        control={control}
        name={fieldPath}
        rules={{
          required: field.required ? `${field.label} is required` : false,
        }}
        render={({ field: formField }) => (
          <Select
            value={formField.value || ""}
            onValueChange={formField.onChange}
            disabled={isLoading || isEmpty}
          >
            <SelectTrigger
              id={fieldPath}
              className={cn(
                error && "border-destructive focus:ring-destructive"
              )}
            >
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {isLoading ? (
                <div className="p-2">
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : isEmpty ? (
                <SelectItem value="__empty__" disabled>
                  {emptyMessage}
                </SelectItem>
              ) : (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                            {"imageUrl" in option && typeof option.imageUrl === "string" && option.imageUrl && (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="h-4 w-4 rounded object-cover"
                        />
                      )}
                      <span>{option.label}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      />
      {dataSourceError && (
        <p className="text-xs text-destructive">{dataSourceError}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
