import { z } from "zod";

export const artistCreateSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  slug: z.string().min(1),
});

export const artistUpdateSchema = artistCreateSchema.partial().extend({
  id: z.string().uuid(),
});


