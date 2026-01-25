import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";
import { requireAdmin } from "@/lib/auth";

const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
const ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/flac",
  "audio/mp4",
  "audio/m4a",
  "audio/ogg",
  "audio/opus",
];

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = formData.get("folderPath") as string | null;

    if (!folderPath) {
      return NextResponse.json({ error: "No folderPath provided" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Generate filename with timestamp and appropriate extension
    const timestamp = Date.now();
    let extension = "mp3"; // default

    // Determine extension based on file name or MIME type
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".mp3") || file.type === "audio/mpeg" || file.type === "audio/mp3") {
      extension = "mp3";
    } else if (fileName.endsWith(".wav") || file.type === "audio/wav" || file.type === "audio/wave") {
      extension = "wav";
    } else if (fileName.endsWith(".flac") || file.type === "audio/flac") {
      extension = "flac";
    } else if (fileName.endsWith(".m4a") || file.type === "audio/m4a") {
      extension = "m4a";
    } else if (fileName.endsWith(".mp4") || file.type === "audio/mp4") {
      extension = "mp4";
    } else if (fileName.endsWith(".ogg") || file.type === "audio/ogg" || file.type === "audio/opus") {
      extension = "ogg";
    }

    const filename = `audio_${timestamp}.${extension}`;
    const storagePath = `${folderPath}/${filename}`;

    // Upload to Bunny Storage
    try {
      const cdnUrl = await uploadToBunny(fileBuffer, storagePath);
      return NextResponse.json(
        {
          url: cdnUrl,
          fileSize: file.size,
          // Note: Duration extraction would need to be done client-side or with a library
          // For now, we return the file size and let the client extract duration
        },
        { status: 200 }
      );
    } catch (uploadError: any) {
      console.error("Error uploading to Bunny:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file to Bunny Storage" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in audio upload route:", error);
    return NextResponse.json({ error: error.message || "Failed to upload audio file" }, { status: 500 });
  }
}
