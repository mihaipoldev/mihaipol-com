import { NextRequest } from "next/server"
import { createUpdate, updateUpdate, deleteUpdate } from "@/features/updates/mutations"
import { updateCreateSchema, updateUpdateSchema } from "@/features/updates/schemas"
import { ok, created, badRequest, serverError } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = updateCreateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const data = await createUpdate(parsed.data)
    return created(data)
  } catch (error: any) {
    console.error("Error creating update:", error)
    return serverError("Failed to create update", error?.message)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = updateUpdateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const { id, ...updates } = parsed.data
    const data = await updateUpdate(id, updates)
    return ok(data)
  } catch (error: any) {
    console.error("Error updating update:", error)
    return serverError("Failed to update update", error?.message)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) return badRequest("Missing update id")
    await deleteUpdate(id)
    return ok({ success: true })
  } catch (error: any) {
    console.error("Error deleting update:", error)
    return serverError("Failed to delete update", error?.message)
  }
}


