import { z } from "zod";

export const eventCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  date: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  event_status: z.enum(["upcoming", "past", "cancelled"]).optional(),
  tickets_url: z.string().url().nullable().optional(),
  ticket_label: z.string().nullable().optional(),
});

export const eventUpdateSchema = eventCreateSchema.partial().extend({
  id: z.string().uuid(),
});


