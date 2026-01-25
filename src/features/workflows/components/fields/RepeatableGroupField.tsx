"use client";

import { useFieldArray, Control, FieldErrors } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import type { RepeatableGroupField as RepeatableGroupFieldType } from "../../types/form.types";
import { FormFieldRenderer } from "./FormFieldRenderer";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";
import { cn } from "@/lib/utils";

type RepeatableGroupFieldProps = {
  field: RepeatableGroupFieldType;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
};

export function RepeatableGroupField({
  field,
  control,
  errors,
  fieldPath,
  entityType,
  entityId,
  images,
  tracks,
}: RepeatableGroupFieldProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldPath,
  });

  const minEntries = field.min_entries || 0;
  const canRemove = fields.length > minEntries;

  // Create default values for a new entry
  const getDefaultValues = () => {
    const defaults: Record<string, any> = {};
    field.fields.forEach((f) => {
      if (f.type === "checkbox") {
        defaults[f.name] = false;
      } else if (f.type === "multi_select") {
        defaults[f.name] = [];
      } else {
        defaults[f.name] = "";
      }
    });
    return defaults;
  };

  const handleAdd = () => {
    append(getDefaultValues());
  };

  const handleRemove = (index: number) => {
    if (canRemove) {
      remove(index);
    }
  };

  // Generate summary for an entry
  const getEntrySummary = (index: number): string => {
    const entryErrors = (errors[field.name] as any)?.[index];
    if (!entryErrors) return `${field.label} ${index + 1}`;

    // Try to find a meaningful field to show in summary
    const summaryFields = field.fields.filter(
      (f) => f.type === "select" || f.type === "input"
    );
    if (summaryFields.length > 0) {
      return `${field.label} ${index + 1}`;
    }
    return `${field.label} ${index + 1}`;
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}

      {fields.length === 0 ? (
        <Button
          type="button"
          variant="outline"
          className="w-full py-8 border border-dashed"
          onClick={handleAdd}
          disabled={field.max_entries !== undefined && fields.length >= field.max_entries}
        >
          <span className="text-sm text-muted-foreground">
            No entry yet. Click here to add new one.
          </span>
        </Button>
      ) : (
        <>
          {fields.map((fieldItem, index) => (
            <div
              key={fieldItem.id}
              className={cn(
                "p-4 border border-border rounded-lg space-y-4 bg-muted/30",
                (errors[field.name] as any)?.[index] && "border-destructive/50"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">
                  {getEntrySummary(index)}
                </Label>
                {canRemove && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {field.fields.map((nestedField) => (
                  <FormFieldRenderer
                    key={nestedField.name}
                    field={nestedField}
                    control={control}
                    errors={(errors[field.name] as any)?.[index] || {}}
                    fieldPath={`${fieldPath}.${index}.${nestedField.name}`}
                    entityType={entityType}
                    entityId={entityId}
                    images={images}
                    tracks={tracks}
                  />
                ))}
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            className="w-full py-8 border border-dashed"
            onClick={handleAdd}
            disabled={field.max_entries !== undefined && fields.length >= field.max_entries}
          >
            <span className="text-sm text-muted-foreground">
              No entry yet. Click here to add new one.
            </span>
          </Button>
        </>
      )}

      {errors[field.name] && typeof errors[field.name] === "object" && (
        <p className="text-xs text-destructive">
          Please fix errors in the entries above
        </p>
      )}
    </div>
  );
}
