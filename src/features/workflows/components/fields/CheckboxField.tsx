"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CheckboxField as CheckboxFieldType } from "../../types/form.types";
import { cn } from "@/lib/utils";

type CheckboxFieldProps = {
  field: CheckboxFieldType;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
};

export function CheckboxField({
  field,
  control,
  errors,
  fieldPath,
}: CheckboxFieldProps) {
  const error = errors[field.name]?.message as string | undefined;

  return (
    <div className="space-y-2">
      <Controller
        control={control}
        name={fieldPath}
        render={({ field: formField }) => (
          <div
            className={cn(
              "flex items-center space-x-3 p-3 rounded-md border transition-colors cursor-pointer",
              formField.value
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            )}
            onClick={() => formField.onChange(!formField.value)}
          >
            <Checkbox
              id={fieldPath}
              checked={formField.value || false}
              onCheckedChange={formField.onChange}
            />
            <Label
              htmlFor={fieldPath}
              className="font-normal cursor-pointer flex-1"
            >
              {field.label}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
          </div>
        )}
      />
      {field.description && (
        <p className="text-xs text-muted-foreground ml-7">
          {field.description}
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
