import { NextRequest, NextResponse } from "next/server";
import { moveImageBetweenFolders } from "@/lib/bunny";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl, newFolderPath } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "No imageUrl provided" }, { status: 400 });
    }

    if (!newFolderPath || typeof newFolderPath !== "string") {
      return NextResponse.json({ error: "No newFolderPath provided" }, { status: 400 });
    }

    // Move the image from one folder to another
    const newUrl = await moveImageBetweenFolders(imageUrl, newFolderPath);

    return NextResponse.json({ url: newUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Error moving image:", error);
    return NextResponse.json({ error: error.message || "Failed to move image" }, { status: 500 });
  }
}
