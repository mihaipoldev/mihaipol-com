import { z } from "zod";

export const entityTypeCreateSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  enabled: z.boolean().optional().default(true),
});

const uuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: "Invalid UUID format",
  });

export const entityTypeUpdateSchema = entityTypeCreateSchema.partial().extend({
  id: uuidLike,
});

export const entityTypeWorkflowsUpdateSchema = z.object({
  workflows: z.array(
    z.object({
      workflow_id: uuidLike,
      display_order: z.number().int().min(0),
    })
  ),
});
