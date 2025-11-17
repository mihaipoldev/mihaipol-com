import { z } from "zod";

// Helper to transform empty strings to null and validate URLs
const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const updateCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  image_url: urlOrEmpty,
  description: z.string().nullable().optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  read_more_url: urlOrEmpty,
});

export const updateUpdateSchema = updateCreateSchema.partial().extend({
  id: z.string().uuid(),
});
