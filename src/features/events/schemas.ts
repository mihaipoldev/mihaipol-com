import { z } from "zod";

const urlOrEmpty = z
  .union([z.string().url(), z.literal(""), z.null()])
  .optional()
  .transform((val) => (val === "" || val == null ? null : val));

export const eventCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  date: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  event_status: z.enum(["upcoming", "past", "cancelled"]).optional(),
  publish_status: z.enum(["draft", "scheduled", "published", "archived"]).optional(),
  tickets_url: urlOrEmpty,
  ticket_label: z.string().nullable().optional(),
  flyer_image_url: urlOrEmpty,
});

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().uuid(),
});
