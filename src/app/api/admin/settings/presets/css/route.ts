import { NextRequest } from "next/server";
import { generateAllCustomPresetsCSS } from "@/lib/landing-page-presets-server";
import { ok, serverError } from "@/lib/api";

// Ensure this route uses Node.js runtime (required for fs operations)
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const css = generateAllCustomPresetsCSS();
    
    // Count presets in CSS for debugging
    const presetMatches = css.match(/preset-landing-page-\d+/g) || [];
    const uniquePresets = new Set(presetMatches);
    console.log(`[PresetCSS] Generated CSS for ${uniquePresets.size} presets:`, Array.from(uniquePresets).sort((a, b) => {
      const idA = parseInt(a.replace('preset-landing-page-', ''));
      const idB = parseInt(b.replace('preset-landing-page-', ''));
      return idA - idB;
    }));
    
    // In development, disable caching. In production, cache for shorter time
    const cacheControl = process.env.NODE_ENV === 'development' 
      ? 'no-store, no-cache, must-revalidate, proxy-revalidate'
      : 'public, max-age=300'; // 5 minutes in production
    
    return new Response(css, {
      headers: {
        "Content-Type": "text/css",
        "Cache-Control": cacheControl,
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error: any) {
    console.error("Error generating preset CSS:", error);
    return serverError("Failed to generate preset CSS", error?.message);
  }
}
