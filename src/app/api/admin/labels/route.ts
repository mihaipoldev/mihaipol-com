import { NextRequest } from "next/server"
import { createLabel, updateLabel, deleteLabel } from "@/features/labels/mutations"
import { labelCreateSchema, labelUpdateSchema } from "@/features/labels/schemas"
import { ok, created, badRequest, serverError } from "@/lib/api"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = labelCreateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const data = await createLabel(parsed.data)
    return created(data)
  } catch (error: any) {
    console.error("Error creating label:", error)
    return serverError("Failed to create label", error?.message)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const json = await request.json()
    const parsed = labelUpdateSchema.safeParse(json)
    if (!parsed.success) return badRequest("Invalid payload", parsed.error.flatten())
    const { id, ...updates } = parsed.data
    const data = await updateLabel(id, updates)
    return ok(data)
  } catch (error: any) {
    console.error("Error updating label:", error)
    return serverError("Failed to update label", error?.message)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request)
    if ("status" in (guard as any)) return guard as any
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) return badRequest("Missing label id")
    await deleteLabel(id)
    return ok({ success: true })
  } catch (error: any) {
    console.error("Error deleting label:", error)
    return serverError("Failed to delete label", error?.message)
  }
}


