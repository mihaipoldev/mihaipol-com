"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { TextAreaField } from "../../types/form.types";
import { cn } from "@/lib/utils";

type TextAreaFieldProps = {
  field: TextAreaField;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
};

export function TextAreaFieldComponent({
  field,
  control,
  errors,
  fieldPath,
}: TextAreaFieldProps) {
  const error = errors[field.name]?.message as string | undefined;

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
          maxLength: field.max_length
            ? {
                value: field.max_length,
                message: `Maximum length is ${field.max_length} characters`,
              }
            : undefined,
        }}
        render={({ field: formField }) => {
          const charCount = formField.value?.length || 0;
          return (
            <div className="space-y-1">
              <Textarea
                id={fieldPath}
                {...formField}
                placeholder={field.placeholder}
                rows={field.rows || 4}
                className={cn(
                  "resize-none min-h-[60px]",
                  error && "border-destructive focus-visible:ring-destructive"
                )}
                maxLength={field.max_length}
                onChange={formField.onChange}
              />
              {field.max_length && (
                <p className="text-xs text-muted-foreground text-right">
                  {charCount} / {field.max_length}
                </p>
              )}
            </div>
          );
        }}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
