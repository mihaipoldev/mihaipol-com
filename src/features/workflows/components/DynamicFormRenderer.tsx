"use client";

import { useForm } from "react-hook-form";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import type { InputSchemaField, FormData } from "../types/form.types";
import { FormFieldRenderer } from "./fields/FormFieldRenderer";
import { RepeatableGroupField } from "./fields/RepeatableGroupField";
import type { AlbumImage, AlbumAudio } from "@/features/albums/types";

type DynamicFormRendererProps = {
  schema: InputSchemaField[];
  entityType: string;
  entityId: string;
  images: AlbumImage[];
  tracks: AlbumAudio[];
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
  defaultValues?: FormData;
};

export type DynamicFormRendererRef = {
  submit: () => void;
};

export const DynamicFormRenderer = forwardRef<
  DynamicFormRendererRef,
  DynamicFormRendererProps
>(function DynamicFormRenderer(
  {
    schema,
    entityType,
    entityId,
    images,
    tracks,
    onSubmit,
    isSubmitting,
    defaultValues: providedDefaultValues,
  },
  ref
) {
  // Build default values from schema
  const getDefaultValues = (): FormData => {
    // If default values are provided, merge them with schema defaults
    const schemaDefaults: FormData = {};

    // Helper to get default value for a field based on its type and options
    const getFieldDefault = (field: InputSchemaField): any => {
      // Field-specific defaults by name
      if (field.name === "format" || field.name === "output_format") {
        // For format fields, try to find "mp4" in options, otherwise use first option
        if (field.type === "select" && field.options && field.options.length > 0) {
          const mp4Option = field.options.find((opt) => opt.value.toLowerCase() === "mp4");
          return mp4Option ? mp4Option.value : field.options[0].value;
        }
        return "mp4";
      }

      if (field.name === "background_color") {
        // For background_color, try to find black option (could be "black" or "#000000")
        if (field.type === "radio" && field.options && field.options.length > 0) {
          const blackOption = field.options.find(
            (opt) => opt.value.toLowerCase() === "black" || opt.value.toLowerCase() === "#000000"
          );
          if (blackOption) return blackOption.value;
          // If no black option, try to find first option with "#000000" or contains "black"
          const defaultOption = field.options.find(
            (opt) => opt.value === "#000000" || opt.label.toLowerCase().includes("black")
          );
          if (defaultOption) return defaultOption.value;
          // Otherwise use first option
          return field.options[0].value;
        }
        if (field.type === "select" && field.options && field.options.length > 0) {
          const blackOption = field.options.find(
            (opt) => opt.value.toLowerCase() === "black" || opt.value.toLowerCase() === "#000000"
          );
          if (blackOption) return blackOption.value;
          return field.options[0].value;
        }
        // Fallback to "black" or "#000000"
        return "black";
      }

      // Default values for common fields
      if (field.name === "quality") {
        if (field.type === "select" && field.options && field.options.length > 0) {
          const option720p = field.options.find((opt) => opt.value === "720p");
          return option720p ? option720p.value : field.options[0].value;
        }
        return "720p";
      }

      if (field.name === "aspect_ratio") {
        if (field.type === "radio" && field.options && field.options.length > 0) {
          const option169 = field.options.find((opt) => opt.value === "16:9");
          return option169 ? option169.value : field.options[0].value;
        }
        return "16:9";
      }

      // Type-based defaults
      if (field.type === "checkbox") {
        return false;
      }
      if (field.type === "multi_select") {
        return [];
      }
      if (field.type === "select" && field.options && field.options.length > 0) {
        return field.options[0].value;
      }
      if (field.type === "radio" && field.options && field.options.length > 0) {
        return field.options[0].value;
      }

      return "";
    };

    schema.forEach((field) => {
      if (field.type === "repeatable_group") {
        // Initialize with minimum entries if specified
        const minEntries = field.min_entries || 0;
        schemaDefaults[field.name] = Array(minEntries)
          .fill(null)
          .map(() => {
            const entryDefaults: Record<string, any> = {};
            field.fields.forEach((f) => {
              entryDefaults[f.name] = getFieldDefault(f);
            });
            return entryDefaults;
          });
      } else {
        schemaDefaults[field.name] = getFieldDefault(field);
      }
    });

    // Merge provided defaults with schema defaults (provided defaults take precedence)
    return { ...schemaDefaults, ...providedDefaultValues };
  };

  const defaultValues = getDefaultValues();
  console.log("[DynamicFormRenderer] Default values:", defaultValues);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues,
    mode: "onChange",
  });

  const firstErrorRef = useRef<HTMLDivElement>(null);

  // Scroll to first error on validation failure
  useEffect(() => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [errors]);

  const onFormSubmit = async (data: FormData) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      // Error handling is done in parent component
      console.error("Form submission error:", error);
    }
  };

  // Handle validation errors
  const handleFormSubmit = handleSubmit(onFormSubmit, (errors) => {
    // Scroll to first error
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        (errorElement as HTMLElement).focus();
      }
    }
  });

  // Expose submit method via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      handleFormSubmit();
    },
  }));

  if (!schema || schema.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No form fields configured for this workflow.</p>
      </div>
    );
  }

  return (
    <form id={`workflow-form-${entityId}`} onSubmit={handleFormSubmit} >
      <div ref={firstErrorRef} />
      <div className="space-y-6">
        {schema.map((field) => {
          const fieldPath = field.name;
          if (field.type === "repeatable_group") {
            return (
              <RepeatableGroupField
                key={field.name}
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
          }
          return (
            <FormFieldRenderer
              key={field.name}
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
        })}
      </div>
    </form>
  );
});
