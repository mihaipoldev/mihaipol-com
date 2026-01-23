import Script from "next/script";
import { getCurrentUser } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { hexToHsl } from "@/lib/colorUtils";

/**
 * Server component that injects the user's primary color as a blocking script
 * This prevents the flash of default color on page load
 */
export async function ColorInitializer() {
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

    // Use beforeInteractive script as a backup to ensure color is applied
    // The middleware should inject the style tag, but this ensures it works
    return (
      <Script
        id="color-initializer"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const hsl = { h: ${hsl.h}, s: ${hsl.s}, l: ${hsl.l} };
              const primaryValue = '${primaryValue}';
              
              // Apply immediately to prevent any flash
              function applyColor() {
                // Apply to documentElement
                if (document.documentElement) {
                  document.documentElement.style.setProperty('--brand-h', hsl.h.toString(), 'important');
                  document.documentElement.style.setProperty('--brand-s', hsl.s + '%', 'important');
                  document.documentElement.style.setProperty('--brand-l', hsl.l + '%', 'important');
                  document.documentElement.style.setProperty('--primary', primaryValue, 'important');
                }
                
                // Apply to body
                if (document.body) {
                  document.body.style.setProperty('--brand-h', hsl.h.toString(), 'important');
                  document.body.style.setProperty('--brand-s', hsl.s + '%', 'important');
                  document.body.style.setProperty('--brand-l', hsl.l + '%', 'important');
                  document.body.style.setProperty('--primary', primaryValue, 'important');
                }
                
                // Inject style tag if not already present
                const styleId = 'primary-color-inline';
                if (!document.getElementById(styleId)) {
                  const styleEl = document.createElement('style');
                  styleEl.id = styleId;
                  styleEl.textContent = \`:root,html,body,.preset-balanced,body.preset-balanced{--brand-h:\${hsl.h}!important;--brand-s:\${hsl.s}%!important;--brand-l:\${hsl.l}%!important;--primary:\${primaryValue}!important;}\`;
                  if (document.head.firstChild) {
                    document.head.insertBefore(styleEl, document.head.firstChild);
                  } else {
                    document.head.appendChild(styleEl);
                  }
                }
              }
              
              // Apply immediately
              applyColor();
              
              // Also apply when DOM is ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', applyColor);
              }
            })();
          `,
        }}
      />
    );
  } catch (error) {
    console.error("Failed to initialize color:", error);
    return null;
  }
}
