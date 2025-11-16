import { NextRequest, NextResponse } from "next/server"
import { createPlatform, updatePlatform, deletePlatform } from "@/features/platforms/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createPlatform(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating platform:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create platform" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "Missing platform id" }, { status: 400 })
    }
    const data = await updatePlatform(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating platform:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update platform" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing platform id" }, { status: 400 })
    }
    await deletePlatform(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting platform:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete platform" },
      { status: 500 }
    )
  }
}


