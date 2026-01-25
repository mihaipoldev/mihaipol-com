"use client";

import { Control, FieldErrors } from "react-hook-form";
import type { InputSchemaField } from "../../types/form.types";
import { TextInputField } from "./TextInputField";
import { TextAreaFieldComponent } from "./TextAreaField";
import { SelectField } from "./SelectField";
import { MultiSelectField } from "./MultiSelectField";
import { RadioGroupField } from "./RadioGroupField";
import { CheckboxField } from "./CheckboxField";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";

type FormFieldRendererProps = {
  field: InputSchemaField;
  control: Control<any>;
  errors: FieldErrors<any>;
  fieldPath: string;
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
};

export function FormFieldRenderer({
  field,
  control,
  errors,
  fieldPath,
  entityType,
  entityId,
  images,
  tracks,
}: FormFieldRendererProps) {
  switch (field.type) {
    case "input":
      return (
        <TextInputField
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
        />
      );
    case "textarea":
      return (
        <TextAreaFieldComponent
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
        />
      );
    case "select":
      return (
        <SelectField
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
          entityType={entityType}
          entityId={entityId}
          images={images}
          tracks={tracks}
        />
      );
    case "multi_select":
      return (
        <MultiSelectField
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
          entityType={entityType}
          entityId={entityId}
          images={images}
          tracks={tracks}
        />
      );
    case "radio":
      return (
        <RadioGroupField
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
        />
      );
    case "checkbox":
      return (
        <CheckboxField
          field={field}
          control={control}
          errors={errors}
          fieldPath={fieldPath}
        />
      );
    default:
      return null;
  }
}
