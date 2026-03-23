import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy route to fetch audio files from Bunny CDN with proper CORS headers
 * This bypasses CORS restrictions for WaveSurfer.js
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate that the URL is from Bunny CDN for security
  const allowedCdnDomains = ["https://mihaipol-com.b-cdn.net/", "https://evergreensystems.b-cdn.net/"];
  if (!allowedCdnDomains.some((d) => url.startsWith(d))) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    // Fetch the audio file from Bunny CDN
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "audio/mpeg";
    const contentLength = response.headers.get("content-length");

    // Stream the response instead of loading into memory
    // This is much more efficient for large files (up to 1GB)
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(contentLength && { "Content-Length": contentLength }),
      },
    });
  } catch (error: any) {
    console.error("Error proxying audio:", error);
    return NextResponse.json({ error: error.message || "Failed to proxy audio" }, { status: 500 });
  }
}
