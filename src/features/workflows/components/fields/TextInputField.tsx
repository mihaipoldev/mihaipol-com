"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InputField } from "../../types/form.types";
import { cn } from "@/lib/utils";

type TextInputFieldProps = {
  field: InputField;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
};

export function TextInputField({
  field,
  control,
  errors,
  fieldPath,
}: TextInputFieldProps) {
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
        render={({ field: formField }) => (
          <Input
            id={fieldPath}
            {...formField}
            placeholder={field.placeholder}
            className={cn(
              error && "border-destructive focus-visible:ring-destructive"
            )}
            maxLength={field.max_length}
          />
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
