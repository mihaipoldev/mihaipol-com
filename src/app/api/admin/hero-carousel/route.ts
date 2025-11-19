import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { moveToTrash } from "@/lib/bunny";
import { z } from "zod";

const createImageSchema = z.object({
  image_url: z.string().min(1),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

const updateImageSchema = z.object({
  id: z.string().uuid(),
  image_url: z.string().min(1).optional(),
  alt_text: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { getAllHeroCarouselImages } = await import("@/features/hero-carousel/data");
    const images = await getAllHeroCarouselImages();

    return ok(images);
  } catch (error: any) {
    console.error("Error fetching hero carousel images:", error);
    return serverError("Failed to fetch hero carousel images", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const json = await request.json();
    const parsed = createImageSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const { data, error } = await supabase
      .from("hero_carousel_images")
      .insert({
        image_url: parsed.data.image_url,
        alt_text: parsed.data.alt_text || null,
        sort_order: parsed.data.sort_order ?? 0,
        is_active: parsed.data.is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating hero carousel image:", error);
      return serverError("Failed to create hero carousel image", error?.message);
    }

    return ok(data);
  } catch (error: any) {
    console.error("Error creating hero carousel image:", error);
    return serverError("Failed to create hero carousel image", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const json = await request.json();
    const parsed = updateImageSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid payload", parsed.error.flatten());
    }

    const { id, ...updates } = parsed.data;

    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    const updateData: any = {};
    if (updates.image_url !== undefined) updateData.image_url = updates.image_url;
    if (updates.alt_text !== undefined) updateData.alt_text = updates.alt_text;
    if (updates.sort_order !== undefined) updateData.sort_order = updates.sort_order;
    if (updates.is_active !== undefined) updateData.is_active = updates.is_active;

    const { data, error } = await supabase
      .from("hero_carousel_images")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating hero carousel image:", error);
      return serverError("Failed to update hero carousel image", error?.message);
    }

    return ok(data);
  } catch (error: any) {
    console.error("Error updating hero carousel image:", error);
    return serverError("Failed to update hero carousel image", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return badRequest("Missing image id");
    }

    const { getServiceSupabaseClient } = await import("@/lib/supabase/server");
    const supabase = getServiceSupabaseClient();

    // First, get the image URL before deleting
    const { data: imageData, error: fetchError } = await supabase
      .from("hero_carousel_images")
      .select("image_url")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching image:", fetchError);
      return serverError("Failed to fetch image", fetchError.message);
    }

    // Delete from database
    const { error } = await supabase.from("hero_carousel_images").delete().eq("id", id);

    if (error) {
      console.error("Error deleting hero carousel image:", error);
      return serverError("Failed to delete hero carousel image", error.message);
    }

    // Move image to trash in Bunny CDN if it exists and is from our CDN
    if (imageData?.image_url && imageData.image_url.includes("mihaipol-com.b-cdn.net")) {
      try {
        await moveToTrash(imageData.image_url);
      } catch (trashError) {
        // Log but don't fail - database record is already deleted
        console.error("Failed to move image to trash:", trashError);
      }
    }

    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting hero carousel image:", error);
    return serverError("Failed to delete hero carousel image", error?.message);
  }
}

