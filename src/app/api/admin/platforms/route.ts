import { NextRequest } from "next/server"
import { createPlatform, updatePlatform, deletePlatform } from "@/features/smart-links/platforms/mutations"
import { platformCreateSchema, platformUpdateSchema } from "@/features/platforms/schemas"
import { ok, created, badRequest, serverError } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = platformCreateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const platformData = {
      ...parsed.data,
      is_active: true,
      sort_order: 0
    }
    const data = await createPlatform(platformData)
    return created(data)
  } catch (error: any) {
    console.error("Error creating platform:", error)
    return serverError("Failed to create platform", error?.message)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = platformUpdateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const { id, ...updates } = parsed.data
    const data = await updatePlatform(id, updates)
    return ok(data)
  } catch (error: any) {
    console.error("Error updating platform:", error)
    return serverError("Failed to update platform", error?.message)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) return badRequest("Missing platform id")
    await deletePlatform(id)
    return ok({ success: true })
  } catch (error: any) {
    console.error("Error deleting platform:", error)
    return serverError("Failed to delete platform", error?.message)
  }
}


