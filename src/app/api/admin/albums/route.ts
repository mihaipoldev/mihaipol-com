import { NextRequest, NextResponse } from "next/server"
import { createAlbum, updateAlbum, deleteAlbum } from "@/features/albums/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createAlbum(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating album:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create album" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    if (!id) {
      return NextResponse.json({ error: "Missing album id" }, { status: 400 })
    }
    const data = await updateAlbum(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating album:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update album" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing album id" }, { status: 400 })
    }
    await deleteAlbum(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting album:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete album" },
      { status: 500 }
    )
  }
}


