import { NextRequest, NextResponse } from "next/server";
import { getPresetsForEntity } from "@/features/workflows/presets/data";

export const dynamic = "force-dynamic";

/**
 * Get presets for an entity type
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get("entity_type");

    if (!entityType) {
      return NextResponse.json({ error: "entity_type is required" }, { status: 400 });
    }

    const presets = await getPresetsForEntity(entityType);

    return NextResponse.json(presets);
  } catch (error: any) {
    console.error("[Get Presets] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch presets" },
      { status: 500 }
    );
  }
}
