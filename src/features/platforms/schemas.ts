import { z } from "zod";

// Helper to transform empty strings to null and validate URLs
const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const platformCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  display_name: z.string().min(1),
  base_url: urlOrEmpty,
  icon_url: urlOrEmpty,
  default_cta_label: z.string().nullable().optional(),
});

export const platformUpdateSchema = platformCreateSchema.partial().extend({
  id: z.string().uuid(),
});
