import { NextRequest } from "next/server";
import { generateAllCustomPresetsCSS } from "@/lib/landing-page-presets-server";
import { ok, serverError } from "@/lib/api";

// Ensure this route uses Node.js runtime (required for fs operations)
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const css = generateAllCustomPresetsCSS();
    return new Response(css, {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error: any) {
    console.error("Error generating preset CSS:", error);
    return serverError("Failed to generate preset CSS", error?.message);
  }
}
