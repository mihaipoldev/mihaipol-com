// Type definitions for dynamic workflow form schema

export type FormFieldOption = {
  label: string;
  value: string;
};

// Base field type that all field types extend
export type BaseInputSchemaField = {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
};

// Input field (text input)
export type InputField = BaseInputSchemaField & {
  type: "input";
  max_length?: number;
};

// Textarea field
export type TextAreaField = BaseInputSchemaField & {
  type: "textarea";
  max_length?: number;
  rows?: number;
};

// Select field (single selection)
export type SelectField = BaseInputSchemaField & {
  type: "select";
  options?: FormFieldOption[];
  data_source?: string; // e.g., "album.images", "album.tracks"
};

// Multi-select field (multiple selection)
export type MultiSelectField = BaseInputSchemaField & {
  type: "multi_select";
  options?: FormFieldOption[];
  data_source?: string;
};

// Radio field (single selection from options)
export type RadioField = BaseInputSchemaField & {
  type: "radio";
  options: FormFieldOption[];
};

// Checkbox field (boolean)
export type CheckboxField = BaseInputSchemaField & {
  type: "checkbox";
};

// Repeatable group field (nested fields that can be repeated)
export type RepeatableGroupField = BaseInputSchemaField & {
  type: "repeatable_group";
  fields: InputSchemaField[];
  min_entries?: number;
  max_entries?: number;
};

// Union type for all field types
export type InputSchemaField =
  | InputField
  | TextAreaField
  | SelectField
  | MultiSelectField
  | RadioField
  | CheckboxField
  | RepeatableGroupField;

// Form data structure - matches the input_schema structure
export type FormData = Record<string, any>;
