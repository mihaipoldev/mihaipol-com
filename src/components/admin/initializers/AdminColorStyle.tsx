import Script from "next/script";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { hexToHsl } from "@/lib/colorUtils";

/**
 * Server component that injects the user's primary color as a blocking script
 * This prevents the flash of default color on page load by applying styles before render
 * Uses beforeInteractive strategy to ensure it runs before the page becomes interactive
 */
export async function AdminColorStyle() {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      return null;
    }

    // Fetch style_color using server-side client
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("user_settings")
      .select("style_color")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data?.style_color) {
      return null;
    }

    const styleColor = data.style_color;
    if (!styleColor) {
      return null;
    }

    const hsl = hexToHsl(styleColor);
    if (!hsl) {
      return null;
    }

    const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`;

    // Use beforeInteractive script to inject styles IMMEDIATELY and SYNCHRONOUSLY
    // This runs before ANY other JavaScript, preventing any flash
    return (
      <>
        {/* Inject style tag directly in head via script - runs synchronously */}
        <Script
          id="admin-color-style-inline"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Inject style tag IMMEDIATELY - this runs before React, before everything
                const styleId = 'admin-color-inline';
                if (!document.getElementById(styleId)) {
                  const styleEl = document.createElement('style');
                  styleEl.id = styleId;
                  styleEl.textContent = ':root,html,body,.preset-balanced,body.preset-balanced{--brand-h:${hsl.h}!important;--brand-s:${hsl.s}%!important;--brand-l:${hsl.l}%!important;--primary:${primaryValue}!important;}';
                  
                  // Insert into head immediately
                  if (document.head) {
                    document.head.insertBefore(styleEl, document.head.firstChild);
                  } else {
                    // If head doesn't exist, insert before first script or at start of documentElement
                    const firstScript = document.querySelector('script');
                    if (firstScript && firstScript.parentNode) {
                      firstScript.parentNode.insertBefore(styleEl, firstScript);
                    } else if (document.documentElement) {
                      document.documentElement.insertBefore(styleEl, document.documentElement.firstChild);
                    }
                  }
                }
                
                // Also apply inline styles for instant effect
                if (document.documentElement) {
                  document.documentElement.style.setProperty('--brand-h', '${hsl.h}', 'important');
                  document.documentElement.style.setProperty('--brand-s', '${hsl.s}%', 'important');
                  document.documentElement.style.setProperty('--brand-l', '${hsl.l}%', 'important');
                  document.documentElement.style.setProperty('--primary', '${primaryValue}', 'important');
                }
                
                // Save to sessionStorage for next page load
                try {
                  sessionStorage.setItem('primary-color', '${styleColor.replace(/'/g, "\\'")}');
                } catch (e) {
                  // Failed to save to sessionStorage
                }
              })();
            `,
          }}
        />
      </>
    );
  } catch (error) {
    console.error("Failed to initialize color style:", error);
    return null;
  }
}
