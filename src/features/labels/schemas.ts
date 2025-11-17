import { z } from "zod";

// Helper to transform empty strings/null to null and validate URLs
const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const labelCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z
    .union([z.string(), z.literal(""), z.null()])
    .optional()
    .transform((val) => (val === "" || val == null ? null : val)),
  website_url: urlOrEmpty,
  logo_image_url: urlOrEmpty,
});

export const labelUpdateSchema = labelCreateSchema.partial().extend({
  id: z.string().uuid(),
});
