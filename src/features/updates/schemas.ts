import { z } from "zod";

export const updateCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  date: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  description: z.string().nullable().optional(),
  publish_status: z.enum(["draft", "published"]).optional(),
  read_more_url: z.string().url().nullable().optional(),
});

export const updateUpdateSchema = updateCreateSchema.partial().extend({
  id: z.string().uuid(),
});


