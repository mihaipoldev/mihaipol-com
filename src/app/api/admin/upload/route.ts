import { NextRequest, NextResponse } from "next/server";
import { uploadToBunny } from "@/lib/bunny";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const folderPath = formData.get("folderPath") as string | null;
    const imageUrl = formData.get("imageUrl") as string | null;

    if (!folderPath) {
      return NextResponse.json({ error: "No folderPath provided" }, { status: 400 });
    }

    let fileBuffer: Buffer;
    let urlContentType: string | null = null;

    // Handle file upload
    if (file) {
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
          { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
        );
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    }
    // Handle URL upload
    else if (imageUrl) {
      try {
        // Download the image from the URL
        const response = await fetch(imageUrl);
        if (!response.ok) {
          return NextResponse.json(
            { error: `Failed to download image from URL: ${response.statusText}` },
            { status: 400 }
          );
        }

        // Check content type
        urlContentType = response.headers.get("content-type")?.toLowerCase() || "";
        const isValidContentType = ALLOWED_MIME_TYPES.some((type) => {
          const normalizedType = type.toLowerCase();
          // Check if content type starts with the MIME type or contains it (handles cases like "image/svg+xml; charset=utf-8")
          return (
            urlContentType &&
            (urlContentType.startsWith(normalizedType) || urlContentType.includes(normalizedType))
          );
        });

        if (!isValidContentType) {
          return NextResponse.json(
            {
              error: `Invalid image type from URL. Content-Type: ${urlContentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Get content length
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Image size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }

        // Convert to buffer
        const arrayBuffer = await response.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);

        // Validate buffer size
        if (fileBuffer.length > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: `Image size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
            { status: 400 }
          );
        }
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to fetch image from URL: ${error.message}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "No file or imageUrl provided" }, { status: 400 });
    }

    // Generate filename with timestamp and appropriate extension
    const timestamp = Date.now();
    let extension = "jpg"; // default

    // Determine extension based on file type
    if (file) {
      // Get extension from file name or MIME type
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".svg")) {
        extension = "svg";
      } else if (fileName.endsWith(".png")) {
        extension = "png";
      } else if (fileName.endsWith(".gif")) {
        extension = "gif";
      } else if (fileName.endsWith(".webp")) {
        extension = "webp";
      } else if (file.type === "image/svg+xml") {
        extension = "svg";
      } else if (file.type === "image/png") {
        extension = "png";
      } else if (file.type === "image/gif") {
        extension = "gif";
      } else if (file.type === "image/webp") {
        extension = "webp";
      }
    } else if (imageUrl) {
      // Try to get extension from URL path first
      try {
        const url = new URL(imageUrl);
        const pathname = url.pathname.toLowerCase();
        if (pathname.endsWith(".svg")) {
          extension = "svg";
        } else if (pathname.endsWith(".png")) {
          extension = "png";
        } else if (pathname.endsWith(".gif")) {
          extension = "gif";
        } else if (pathname.endsWith(".webp")) {
          extension = "webp";
        } else if (urlContentType) {
          // Use content type from the response we already fetched
          if (urlContentType.includes("svg")) {
            extension = "svg";
          } else if (urlContentType.includes("png")) {
            extension = "png";
          } else if (urlContentType.includes("gif")) {
            extension = "gif";
          } else if (urlContentType.includes("webp")) {
            extension = "webp";
          }
        } else {
          // Fallback: detect from buffer signature
          if (fileBuffer.length >= 4) {
            // SVG: starts with <?xml or <svg
            const start = fileBuffer.toString("utf-8", 0, Math.min(100, fileBuffer.length)).trim();
            if (start.startsWith("<?xml") || start.startsWith("<svg")) {
              extension = "svg";
            }
            // PNG: 89 50 4E 47
            else if (
              fileBuffer[0] === 0x89 &&
              fileBuffer[1] === 0x50 &&
              fileBuffer[2] === 0x4e &&
              fileBuffer[3] === 0x47
            ) {
              extension = "png";
            }
            // GIF: 47 49 46 38
            else if (
              fileBuffer[0] === 0x47 &&
              fileBuffer[1] === 0x49 &&
              fileBuffer[2] === 0x46 &&
              fileBuffer[3] === 0x38
            ) {
              extension = "gif";
            }
            // WebP: RIFF...WEBP
            else if (fileBuffer.length >= 12) {
              const riff = fileBuffer.toString("ascii", 0, 4);
              const webp = fileBuffer.toString("ascii", 8, 12);
              if (riff === "RIFF" && webp === "WEBP") {
                extension = "webp";
              }
            }
          }
        }
      } catch {
        // If URL parsing fails, detect from buffer signature
        if (fileBuffer.length >= 4) {
          const start = fileBuffer.toString("utf-8", 0, Math.min(100, fileBuffer.length)).trim();
          if (start.startsWith("<?xml") || start.startsWith("<svg")) {
            extension = "svg";
          } else if (
            fileBuffer[0] === 0x89 &&
            fileBuffer[1] === 0x50 &&
            fileBuffer[2] === 0x4e &&
            fileBuffer[3] === 0x47
          ) {
            extension = "png";
          } else if (
            fileBuffer[0] === 0x47 &&
            fileBuffer[1] === 0x49 &&
            fileBuffer[2] === 0x46 &&
            fileBuffer[3] === 0x38
          ) {
            extension = "gif";
          } else if (fileBuffer.length >= 12) {
            const riff = fileBuffer.toString("ascii", 0, 4);
            const webp = fileBuffer.toString("ascii", 8, 12);
            if (riff === "RIFF" && webp === "WEBP") {
              extension = "webp";
            }
          }
        }
      }
    }

    const filename = `image_${timestamp}.${extension}`;
    const storagePath = `${folderPath}/${filename}`;

    // Upload to Bunny Storage
    try {
      const cdnUrl = await uploadToBunny(fileBuffer, storagePath);
      return NextResponse.json({ url: cdnUrl }, { status: 200 });
    } catch (uploadError: any) {
      console.error("Error uploading to Bunny:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Failed to upload file to Bunny Storage" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in upload route:", error);
    // Make sure we always return JSON, not HTML
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
