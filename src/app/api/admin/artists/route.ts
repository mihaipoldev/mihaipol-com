import { NextRequest, NextResponse } from "next/server"
import { createArtist, updateArtist, deleteArtist } from "@/features/artists/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createArtist(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating artist:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create artist" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing artist id" },
        { status: 400 }
      )
    }
    
    const data = await updateArtist(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating artist:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update artist" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get("id")
    
    if (!id) {
      return NextResponse.json(
        { error: "Missing artist id" },
        { status: 400 }
      )
    }
    
    await deleteArtist(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting artist:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete artist" },
      { status: 500 }
    )
  }
}

