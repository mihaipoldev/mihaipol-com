import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hexToHsl } from "@/lib/colorUtils";
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
        
        console.log(`[Middleware] Found preset data for ${presetKey}:`, JSON.stringify(presetData.value));
        
        // Handle preset object format (presets are now stored as objects in the database)
        if (typeof presetData.value === "object" && presetData.value !== null && "id" in presetData.value) {
          const presetValue = presetData.value as any;
          
          // Normalize ID - Supabase JSONB might store numbers as strings
          const normalizedId = typeof presetValue.id === "string" ? parseInt(presetValue.id, 10) : presetValue.id;
          
          // Validate that all required fields are present
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
            console.log(`[Middleware] Valid preset object found: ID ${preset.id}, Name: ${preset.name}`);
          } else {
            console.error("[Middleware] Invalid preset object structure - missing required fields:", {
              id: presetValue.id,
              normalizedId,
              idType: typeof presetValue.id,
              normalizedIdType: typeof normalizedId,
              hasName: typeof presetValue.name === "string",
              hasPrimary: typeof presetValue.primary === "string",
              hasSecondary: typeof presetValue.secondary === "string",
              hasAccent: typeof presetValue.accent === "string",
              fullValue: JSON.stringify(presetValue)
            });
          }
        } else if (typeof presetData.value === "number") {
          // Backward compatibility: if it's just a number, we can't look it up in Edge runtime
          // This should not happen with new presets, but log it for debugging
          console.warn("[Middleware] Preset stored as number instead of object (backward compatibility):", presetData.value);
        } else {
          console.error("[Middleware] Unexpected preset value type:", typeof presetData.value, presetData.value);
        }

        if (preset) {
          try {
            // Generate CSS for the selected preset
            selectedPresetCSS = generatePresetCSS(preset);
            console.log(`[Middleware] Generated CSS for preset ${preset.id}, CSS length: ${selectedPresetCSS.length}`);
          } catch (error) {
            console.error("[Middleware] Failed to generate CSS for preset:", preset.id, error);
          }
        } else {
          console.error("[Middleware] No valid preset found for CSS generation. Value:", JSON.stringify(presetData.value));
        }
      } else {
        console.warn(`[Middleware] No preset data found for key: ${presetKey}`);
      }

      // Only inject CSS for the selected preset
      // Custom presets CSS for dropdown selection is handled client-side
      const allCSS = selectedPresetCSS;
      
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
