"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, X } from "lucide-react";
import type { MultiSelectField as MultiSelectFieldType } from "../../types/form.types";
import { useDataSource } from "../../hooks/useDataSource";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

type MultiSelectFieldProps = {
  field: MultiSelectFieldType;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
};

export function MultiSelectField({
  field,
  control,
  errors,
  fieldPath,
  entityType,
  entityId,
  images,
  tracks,
}: MultiSelectFieldProps) {
  const error = errors[field.name]?.message as string | undefined;
  const [open, setOpen] = useState(false);
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
          required: field.required
            ? `Please select at least one option for ${field.label}`
            : false,
          validate: (value) => {
            if (field.required && (!value || value.length === 0)) {
              return `Please select at least one option for ${field.label}`;
            }
            return true;
          },
        }}
        render={({ field: formField }) => {
          const selectedValues = Array.isArray(formField.value)
            ? formField.value
            : [];

          const handleToggle = (value: string) => {
            const newValues = selectedValues.includes(value)
              ? selectedValues.filter((v) => v !== value)
              : [...selectedValues, value];
            formField.onChange(newValues);
          };

          const handleSelectAll = () => {
            formField.onChange(options.map((opt) => opt.value));
          };

          const handleClearAll = () => {
            formField.onChange([]);
          };

          const selectedCount = selectedValues.length;
          const selectedOptions = options.filter((opt) =>
            selectedValues.includes(opt.value)
          );

          return (
            <div className="space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between",
                      error && "border-destructive"
                    )}
                    disabled={isLoading || isEmpty}
                  >
                    <span className="truncate">
                      {selectedCount === 0
                        ? field.placeholder || "Select options"
                        : `${selectedCount} selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto">
                    {isLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : isEmpty ? (
                      <p className="text-sm text-muted-foreground p-2">
                        {emptyMessage}
                      </p>
                    ) : (
                      <>
                        {options.length > 5 && (
                          <div className="flex gap-2 pb-2 border-b">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleSelectAll}
                            >
                              Select All
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleClearAll}
                            >
                              Clear All
                            </Button>
                          </div>
                        )}
                        {options.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                            onClick={() => handleToggle(option.value)}
                          >
                            <Checkbox
                              checked={selectedValues.includes(option.value)}
                              onCheckedChange={() => handleToggle(option.value)}
                            />
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {"imageUrl" in option && typeof option.imageUrl === "string" && option.imageUrl && (
                                <img
                                  src={option.imageUrl}
                                  alt=""
                                  className="h-4 w-4 rounded object-cover flex-shrink-0"
                                />
                              )}
                              <Label className="text-sm font-normal cursor-pointer flex-1 truncate">
                                {option.label}
                              </Label>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="gap-1"
                    >
                      {option.label}
                      <button
                        type="button"
                        onClick={() => handleToggle(option.value)}
                        className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
      {dataSourceError && (
        <p className="text-xs text-destructive">{dataSourceError}</p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
