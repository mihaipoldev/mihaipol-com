import { NextRequest } from "next/server";
import { createEntityType, updateEntityType, deleteEntityType } from "@/features/entity-types/mutations";
import { entityTypeCreateSchema, entityTypeUpdateSchema } from "@/features/entity-types/schemas";
import { getAllEntityTypesIncludingDisabled } from "@/features/entity-types/data";
import { ok, created, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const entityTypes = await getAllEntityTypesIncludingDisabled();
    return ok(entityTypes);
  } catch (error: any) {
    console.error("Error fetching entity types:", error);
    return serverError("Failed to fetch entity types", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = entityTypeCreateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const data = await createEntityType(parsed.data);
    return created(data);
  } catch (error: any) {
    console.error("Error creating entity type:", error);
    return serverError("Failed to create entity type", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const json = await request.json();
    const parsed = entityTypeUpdateSchema.safeParse(json);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error.flatten());
      return badRequest("Invalid payload", parsed.error.flatten());
    }
    const { id, ...updates } = parsed.data;
    const data = await updateEntityType(id, updates);
    return ok(data);
  } catch (error: any) {
    console.error("Error updating entity type:", error);
    return serverError("Failed to update entity type", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    if (!id) {
      return badRequest("Missing entity type id");
    }
    await deleteEntityType(id);
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error deleting entity type:", error);
    return serverError("Failed to delete entity type", error?.message);
  }
}
