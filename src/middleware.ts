import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hexToHsl } from "@/lib/colorUtils";
import { generateAllCustomPresetsCSS, getPresetById } from "@/lib/landing-page-presets-server";
import { generatePresetCSS } from "@/lib/landing-page-presets";
import type { LandingPagePreset } from "@/lib/landing-page-presets";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Set pathname in a custom header for server components to access
  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);

  // Inject preset CSS for landing page routes
  const isLandingPageRoute = pathname === "/" || pathname.startsWith("/dev");
  
  if (isLandingPageRoute) {
    try {
      // Determine which preset to use based on route
      const presetKey = pathname.startsWith("/dev") 
        ? "landing_page_preset_number"  // Dev
        : "landing_page_preset_prod";    // Production

      // Create Supabase client for database access
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

      // Fetch selected preset from database
      const { data: presetData } = await supabase
        .from("site_preferences")
        .select("value")
        .eq("key", presetKey)
        .maybeSingle();

      let selectedPresetCSS = "";
      if (presetData?.value) {
        let preset: LandingPagePreset | null = null;
        
        // Handle preset object or number format
        if (typeof presetData.value === "object" && presetData.value !== null && "id" in presetData.value) {
          preset = presetData.value as LandingPagePreset;
        } else if (typeof presetData.value === "number") {
          preset = getPresetById(presetData.value) || null;
        }

        if (preset) {
          // Generate CSS for the selected preset
          selectedPresetCSS = generatePresetCSS(preset);
        }
      }

      // Generate CSS for all custom presets (for dropdown selection)
      const customPresetsCSS = generateAllCustomPresetsCSS();
      
      // Combine both CSS strings
      const allCSS = selectedPresetCSS + (selectedPresetCSS && customPresetsCSS ? "\n" : "") + customPresetsCSS;
      
      if (allCSS) {
        const styleTag = `<style id="landing-preset-css">${allCSS}</style>`;

        // Use transform stream to inject style tag into HTML head
        let buffer = "";
        let headInjected = false;

        const stream = new TransformStream({
          transform(chunk, controller) {
            buffer += new TextDecoder().decode(chunk);

            // Check if we have the <head> tag and haven't injected yet
            if (!headInjected && /<head[^>]*>/i.test(buffer)) {
              buffer = buffer.replace(/(<head[^>]*>)/i, `$1${styleTag}`);
              headInjected = true;
            }

            // If we've injected or buffer is getting large, flush it
            if (headInjected || buffer.length > 8192) {
              controller.enqueue(new TextEncoder().encode(buffer));
              buffer = "";
            }
          },
          flush(controller) {
            // Flush any remaining buffer
            if (buffer) {
              controller.enqueue(new TextEncoder().encode(buffer));
            }
          },
        });

        return new NextResponse(stream.readable, {
          headers: response.headers,
          status: response.status,
        });
      }
    } catch (error) {
      // Silently fail - don't break the page if preset CSS can't be loaded
      console.error("Failed to inject preset CSS in middleware:", error);
    }
    
    // Return response for landing page routes (even if CSS injection failed)
    return response;
  }

  // For admin pages, inject color style tag into HTML response
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    try {
      // Get user from cookies
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

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        const { data } = await supabase
          .from("user_settings")
          .select("style_color")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data?.style_color) {
          const hsl = hexToHsl(data.style_color);
          if (hsl) {
            const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;
            const styleTag = `<style id="primary-color-inline">:root,html,body,.preset-balanced,body.preset-balanced{--brand-h:${hsl.h}!important;--brand-s:${hsl.s}%!important;--brand-l:${hsl.l}%!important;--primary:${primaryValue}!important;}</style>`;

            // Use transform stream to inject style tag into HTML head
            // Buffer chunks to handle cases where <head> is split across chunks
            let buffer = "";
            let headInjected = false;

            const stream = new TransformStream({
              transform(chunk, controller) {
                buffer += new TextDecoder().decode(chunk);

                // Check if we have the <head> tag and haven't injected yet
                if (!headInjected && /<head[^>]*>/i.test(buffer)) {
                  buffer = buffer.replace(/(<head[^>]*>)/i, `$1${styleTag}`);
                  headInjected = true;
                }

                // If we've injected or buffer is getting large, flush it
                if (headInjected || buffer.length > 8192) {
                  controller.enqueue(new TextEncoder().encode(buffer));
                  buffer = "";
                }
              },
              flush(controller) {
                // Flush any remaining buffer
                if (buffer) {
                  controller.enqueue(new TextEncoder().encode(buffer));
                }
              },
            });

            return new NextResponse(stream.readable, {
              headers: response.headers,
              status: response.status,
            });
          }
        }
      }
    } catch (error) {
      // Silently fail - don't break the page
      console.error("Failed to inject color in middleware:", error);
    }
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
