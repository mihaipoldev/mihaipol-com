import { z } from "zod";

export const linkFolderSchema = z.object({
  folder_url: z.string().url("Invalid URL format"),
});

export const createFolderSchema = z.object({
  album_id: z.string().uuid(),
});

export const updateFolderSchema = z.object({
  album_id: z.string().uuid(),
  title: z.string().optional(),
  release_date: z.string().nullable().optional(),
});
