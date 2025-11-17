import { z } from "zod";

export const albumCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  release_date: z.string().nullable().optional(),
  cover_image_url: z.union([z.string().url(), z.literal(""), z.null()]).optional(),
  label_id: z.union([z.string().uuid(), z.null()]).optional(),
  catalog_number: z.string().nullable().optional(),
  album_type: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
});

// More lenient UUID validation that accepts any UUID-like string
const uuidLike = z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
  message: "Invalid UUID format"
})

export const albumUpdateSchema = albumCreateSchema.partial().extend({
  id: uuidLike,
});


