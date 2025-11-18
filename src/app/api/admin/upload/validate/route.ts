import { NextRequest, NextResponse } from "next/server";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json({ error: "No imageUrl provided", valid: false }, { status: 400 });
    }

    try {
      // Fetch the image
      const response = await fetch(imageUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        return NextResponse.json(
          {
            valid: false,
            error: `Failed to fetch image: ${response.status} ${response.statusText}`,
          },
          { status: 200 }
        );
      }

      // Check content-type header
      const contentType = response.headers.get("content-type")?.toLowerCase() || "";
      // Check if content type matches any allowed MIME type (handles cases like "image/svg+xml; charset=utf-8")
      const isValidContentType = ALLOWED_MIME_TYPES.some((type) => {
        const normalizedType = type.toLowerCase();
        // Check if content type starts with the MIME type or contains it
        return contentType.startsWith(normalizedType) || contentType.includes(normalizedType);
      });
      
      if (!contentType || !isValidContentType) {
        return NextResponse.json(
          { valid: false, error: `Invalid content type: ${contentType || "unknown"}. Expected one of: ${ALLOWED_MIME_TYPES.join(", ")}` },
          { status: 200 }
        );
      }

      // Get the first few bytes to validate it's actually an image
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Check file signatures (magic numbers)
      const isValidImage = validateImageSignature(buffer);

      if (!isValidImage) {
        return NextResponse.json(
          { valid: false, error: "File does not appear to be a valid image" },
          { status: 200 }
        );
      }

      return NextResponse.json({ valid: true }, { status: 200 });
    } catch (fetchError: any) {
      return NextResponse.json(
        { valid: false, error: `Failed to validate image: ${fetchError.message}` },
        { status: 200 }
      );
    }
  } catch (error: any) {
    console.error("Error validating image:", error);
    return NextResponse.json(
      { valid: false, error: error.message || "Failed to validate image" },
      { status: 500 }
    );
  }
}

/**
 * Validate image file signature (magic numbers)
 */
function validateImageSignature(buffer: Buffer): boolean {
  if (buffer.length < 4) {
    return false;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return true;
  }

  // GIF: 47 49 46 38 (GIF8)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }

  // WebP: Check for RIFF...WEBP
  if (buffer.length >= 12) {
    const riff = buffer.toString("ascii", 0, 4);
    const webp = buffer.toString("ascii", 8, 12);
    if (riff === "RIFF" && webp === "WEBP") {
      return true;
    }
  }

  // SVG: Check for XML declaration or <svg tag
  if (buffer.length >= 4) {
    const start = buffer.toString("utf-8", 0, Math.min(100, buffer.length)).trim();
    if (start.startsWith("<?xml") || start.startsWith("<svg")) {
      return true;
    }
  }

  return false;
}
