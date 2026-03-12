import { z } from "zod";

// Helper to transform empty strings to null and validate URLs
const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

// Embed schema for embeds array
const embedSchema = z.object({
  type: z.enum(["youtube", "spotify", "bandcamp", "soundcloud", "instagram"]),
  url: z.string().url().optional(),
  embed_code: z.string().optional(),
});

// External link schema for external_links array
const externalLinkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const updateCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  subtitle: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  image_url: urlOrEmpty,
  description: z.string().nullable().optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  read_more_url: urlOrEmpty,
  embeds: z.array(embedSchema).optional(),
  tags: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  show_cover_image: z.boolean().optional(),
  og_image_url: urlOrEmpty,
  meta_description: z.string().nullable().optional(),
  external_links: z.array(externalLinkSchema).optional(),
});

export const updateUpdateSchema = updateCreateSchema.partial().extend({
  id: z.string().uuid(),
});
