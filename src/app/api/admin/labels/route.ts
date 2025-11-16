import { NextRequest, NextResponse } from "next/server"
import { createLabel, updateLabel, deleteLabel } from "@/features/labels/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createLabel(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating label:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create label" },
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
        { error: "Missing label id" },
        { status: 400 }
      )
    }
    
    const data = await updateLabel(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating label:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update label" },
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
        { error: "Missing label id" },
        { status: 400 }
      )
    }
    
    await deleteLabel(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting label:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete label" },
      { status: 500 }
    )
  }
}


