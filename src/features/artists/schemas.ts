import { z } from "zod";

// Helper to transform empty strings to null and validate URLs
const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

// Helper to handle nullable string fields (accepts string, empty string, or null)
const nullableString = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const artistCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  bio: nullableString,
  profile_image_url: urlOrEmpty,
  city: nullableString,
  country: nullableString,
});

export const artistUpdateSchema = artistCreateSchema.partial().extend({
  id: z.string().uuid(),
});
