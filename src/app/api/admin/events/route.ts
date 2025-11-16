import { NextRequest, NextResponse } from "next/server"
import { createEvent, updateEvent, deleteEvent } from "@/features/events/mutations"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = await createEvent(body)
    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error("Error creating event:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create event" },
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
        { error: "Missing event id" },
        { status: 400 }
      )
    }
    
    const data = await updateEvent(id, updates)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("Error updating event:", error)
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
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
        { error: "Missing event id" },
        { status: 400 }
      )
    }
    
    await deleteEvent(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting event:", error)
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    )
  }
}

