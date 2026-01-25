"use client";

import { Controller, Control, FieldErrors } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { RadioField } from "../../types/form.types";

type RadioGroupFieldProps = {
  field: RadioField;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
};

export function RadioGroupField({
  field,
  control,
  errors,
  fieldPath,
}: RadioGroupFieldProps) {
  const error = errors[field.name]?.message as string | undefined;

  return (
    <div className="space-y-2">
      <Label>
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
          <RadioGroup
            value={formField.value || ""}
            onValueChange={formField.onChange}
            className="space-y-1"
          >
            {field.options.map((option) => (
              <Label
                key={option.value}
                htmlFor={`${fieldPath}-${option.value}`}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <RadioGroupItem
                  value={option.value}
                  id={`${fieldPath}-${option.value}`}
                />
                <span className="font-normal flex-1">
                  {option.label}
                </span>
              </Label>
            ))}
          </RadioGroup>
        )}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
