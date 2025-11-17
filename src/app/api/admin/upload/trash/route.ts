import { NextRequest, NextResponse } from "next/server";
import { moveToTrash } from "@/lib/bunny";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
    }

    // Move the image to trash
    await moveToTrash(imageUrl);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error moving file to trash:", error);
    return NextResponse.json(
      { error: error.message || "Failed to move file to trash" },
      { status: 500 }
    );
  }
}
