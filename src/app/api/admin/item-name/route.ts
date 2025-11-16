import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Map resource types to their name fields
const nameFields: Record<string, string> = {
  albums: "title",
  artists: "name",
  events: "title",
  labels: "name",
  platforms: "name",
  updates: "title",
}

// Map resource types to their table names
const tableNames: Record<string, string> = {
  albums: "albums",
  artists: "artists",
  events: "events",
  labels: "labels",
  platforms: "platforms",
  updates: "updates",
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const resource = searchParams.get("resource")
  const slug = searchParams.get("slug")

  if (!resource || !slug) {
    return NextResponse.json(
      { error: "Missing resource or slug parameter" },
      { status: 400 }
    )
  }

  if (slug === "new") {
    return NextResponse.json({ name: "New" })
  }

  const tableName = tableNames[resource]
  const nameField = nameFields[resource]

  if (!tableName || !nameField) {
    return NextResponse.json(
      { error: "Invalid resource type" },
      { status: 400 }
    )
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select(nameField)
      .eq("slug", slug)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    const value = (data as unknown as Record<string, unknown>)[nameField]
    return NextResponse.json({ name: (value as string) ?? null })
  } catch (error) {
    console.error(`Error fetching ${resource} name:`, error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

