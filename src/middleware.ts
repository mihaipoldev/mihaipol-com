import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { generatePresetCSS } from "@/lib/landing-page-presets";
import type { LandingPagePreset } from "@/lib/landing-page-presets";

function injectStyleIntoHead(response: Response, styleTag: string): Response {
  if (!response.body) return response;

  let buffer = "";
  let headInjected = false;

  const stream = new TransformStream({
    transform(chunk, controller) {
      buffer += new TextDecoder().decode(chunk);
      if (!headInjected && /<head[^>]*>/i.test(buffer)) {
        buffer = buffer.replace(/(<head[^>]*>)/i, `$1${styleTag}`);
        headInjected = true;
      }
      if (headInjected || buffer.length > 8192) {
        controller.enqueue(new TextEncoder().encode(buffer));
        buffer = "";
      }
    },
    flush(controller) {
      if (buffer) {
        controller.enqueue(new TextEncoder().encode(buffer));
      }
    },
  });

  const newResponse = new Response(response.body!.pipeThrough(stream), {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  newResponse.headers.delete("content-length");
  return newResponse;
}

const MAINTENANCE_MODE = true;
const PREVIEW_COOKIE = "mp-preview";

function maintenanceResponse(): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mihai Pol</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100dvh;
      background: #0a0a0a;
      color: #e5e5e5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 480px;
    }
    .name {
      font-size: clamp(2rem, 6vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #fff;
      margin-bottom: 1.5rem;
    }
    .line {
      width: 48px;
      height: 1px;
      background: rgba(255,255,255,0.2);
      margin: 0 auto 1.5rem;
    }
    .status {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="name">Mihai Pol</h1>
    <div class="line"></div>
    <p class="status">Coming Soon</p>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }
  );
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Maintenance gate — only blocks homepage (/), bypass with ?preview=1 (sets cookie)
  if (MAINTENANCE_MODE && pathname === "/") {
    const hasPreviewCookie = request.cookies.get(PREVIEW_COOKIE)?.value === "1";
    const hasPreviewParam = request.nextUrl.searchParams.get("preview") === "1";

    if (hasPreviewParam && !hasPreviewCookie) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("preview");
      const res = NextResponse.redirect(url);
      res.cookies.set(PREVIEW_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      return res;
    }

    if (!hasPreviewCookie && !hasPreviewParam) {
      return maintenanceResponse();
    }
  }

  // Set pathname in a custom header for server components to access
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Inject preset CSS for all public routes
  try {
    const presetKey = "landing_page_preset_number";

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {
            // No-op in middleware
          },
          remove() {
            // No-op in middleware
          },
        },
      }
    );

    const { data: presetData, error: presetError } = await supabase
      .from("site_preferences")
      .select("value")
      .eq("key", presetKey)
      .maybeSingle();

    if (presetError) {
      console.error(`[Middleware] Error fetching preset for ${presetKey}:`, presetError);
    }

    let selectedPresetCSS = "";
    if (presetData?.value) {
      let preset: LandingPagePreset | null = null;

      if (typeof presetData.value === "object" && presetData.value !== null && "id" in presetData.value) {
        const presetValue = presetData.value as any;

        const normalizedId = typeof presetValue.id === "string" ? parseInt(presetValue.id, 10) : presetValue.id;

        if (
          typeof normalizedId === "number" &&
          !isNaN(normalizedId) &&
          typeof presetValue.name === "string" &&
          typeof presetValue.primary === "string" &&
          typeof presetValue.secondary === "string" &&
          typeof presetValue.accent === "string"
        ) {
          preset = {
            id: normalizedId,
            name: presetValue.name,
            primary: presetValue.primary,
            secondary: presetValue.secondary,
            accent: presetValue.accent,
          };
        }
      }

      if (preset) {
        try {
          selectedPresetCSS = generatePresetCSS(preset);
        } catch (error) {
          console.error("[Middleware] Failed to generate CSS for preset:", preset.id, error);
        }
      }
    }

    if (selectedPresetCSS) {
      const styleTag = `<style id="landing-preset-css">${selectedPresetCSS}</style>`;
      return injectStyleIntoHead(response, styleTag);
    }
  } catch (error) {
    console.error("Failed to inject preset CSS in middleware:", error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
