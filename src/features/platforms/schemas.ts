import { z } from "zod";

export const platformCreateSchema = z.object({
  name: z.string().min(1),
  display_name: z.string().min(1),
  icon_url: z.string().url().nullable().optional(),
  slug: z.string().min(1),
});

export const platformUpdateSchema = platformCreateSchema.partial().extend({
  id: z.string().uuid(),
});


