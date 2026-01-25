import { z } from "zod";

const nullableString = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const workflowCreateSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: nullableString,
  icon: nullableString,
  estimated_cost: z.number().nullable().optional(),
  estimated_time_minutes: z.number().int().nullable().optional(),
  input_schema: z.any().nullable().optional(), // Accept any JSON structure (object, array, etc.)
  enabled: z.boolean().optional(),
  default_ai_model: z.string().min(1),
});

const uuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: "Invalid UUID format",
  });

export const workflowUpdateSchema = z.object({
  id: uuidLike,
  slug: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.union([z.string(), z.literal(""), z.null()]).optional().transform((val) => (val === "" || val == null ? null : val)),
  icon: z.union([z.string(), z.literal(""), z.null()]).optional().transform((val) => (val === "" || val == null ? null : val)),
  estimated_cost: z.number().nullable().optional(),
  estimated_time_minutes: z.number().int().nullable().optional(),
  input_schema: z.any().nullable().optional(), // Accept any JSON structure (object, array, etc.)
  enabled: z.boolean().optional(),
  default_ai_model: z.string().min(1).optional(),
});

export const workflowSecretsSchema = z.object({
  webhook_url: z.string().url("Must be a valid URL"),
  api_key: nullableString,
  config: z.record(z.string(), z.any()).nullable().optional(),
});
