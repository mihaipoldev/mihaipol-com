import { NextRequest, NextResponse } from "next/server"
import { createUpdate, updateUpdate, deleteUpdate } from "@/features/updates/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createUpdate(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating update:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create update" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "Missing update id" }, { status: 400 })
    }
    const data = await updateUpdate(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating update:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update update" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing update id" }, { status: 400 })
    }
    await deleteUpdate(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting update:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete update" },
      { status: 500 }
    )
  }
}


