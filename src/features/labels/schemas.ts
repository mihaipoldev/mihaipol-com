import { z } from "zod";

export const labelCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  website_url: z.string().url().nullable().optional(),
});

export const labelUpdateSchema = labelCreateSchema.partial().extend({
  id: z.string().uuid(),
});


