import Script from "next/script"
import { getCurrentUser } from "@/lib/auth"
import { getSupabaseServer } from "@/lib/supabase-ssr"
import { hexToHsl } from "@/lib/colorUtils"

/**
 * Server component that injects the user's primary color as a blocking script
 * This prevents the flash of default color on page load by applying styles before render
 * Uses beforeInteractive strategy to ensure it runs before the page becomes interactive
 */
export async function AdminColorStyle() {
  try {
    const user = await getCurrentUser()
    if (!user?.id) {
      return null
    }

    // Fetch style_color using server-side client
    const supabase = await getSupabaseServer()
    const { data, error } = await supabase
      .from('user_settings')
      .select('style_color')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !data?.style_color) {
      return null
    }

    const styleColor = data.style_color
    if (!styleColor) {
      return null
    }

    const hsl = hexToHsl(styleColor)
    if (!hsl) {
      return null
    }

    const primaryValue = `${hsl.h} ${hsl.s}% ${hsl.l}%`

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
                const startTime = performance.now();
                console.log('[AdminColorStyle] Starting at', startTime.toFixed(2) + 'ms');
                console.log('[AdminColorStyle] Color:', '${styleColor}', 'HSL:', {h: ${hsl.h}, s: ${hsl.s}, l: ${hsl.l}});
                console.log('[AdminColorStyle] Document readyState:', document.readyState);
                console.log('[AdminColorStyle] Has document.head:', !!document.head);
                console.log('[AdminColorStyle] Has documentElement:', !!document.documentElement);
                
                // Inject style tag IMMEDIATELY - this runs before React, before everything
                const styleId = 'admin-color-inline';
                if (!document.getElementById(styleId)) {
                  console.log('[AdminColorStyle] Creating style tag with id:', styleId);
                  const styleEl = document.createElement('style');
                  styleEl.id = styleId;
                  styleEl.textContent = ':root,html,body,.preset-balanced,body.preset-balanced{--brand-h:${hsl.h}!important;--brand-s:${hsl.s}%!important;--brand-l:${hsl.l}%!important;--primary:${primaryValue}!important;}';
                  
                  // Insert into head immediately
                  if (document.head) {
                    document.head.insertBefore(styleEl, document.head.firstChild);
                    console.log('[AdminColorStyle] Inserted style tag into head');
                  } else {
                    console.log('[AdminColorStyle] No document.head, trying alternative insertion');
                    // If head doesn't exist, insert before first script or at start of documentElement
                    const firstScript = document.querySelector('script');
                    if (firstScript && firstScript.parentNode) {
                      firstScript.parentNode.insertBefore(styleEl, firstScript);
                      console.log('[AdminColorStyle] Inserted before first script');
                    } else if (document.documentElement) {
                      document.documentElement.insertBefore(styleEl, document.documentElement.firstChild);
                      console.log('[AdminColorStyle] Inserted at start of documentElement');
                    }
                  }
                } else {
                  console.log('[AdminColorStyle] Style tag already exists, skipping');
                }
                
                // Also apply inline styles for instant effect
                if (document.documentElement) {
                  console.log('[AdminColorStyle] Applying inline styles to documentElement');
                  document.documentElement.style.setProperty('--brand-h', '${hsl.h}', 'important');
                  document.documentElement.style.setProperty('--brand-s', '${hsl.s}%', 'important');
                  document.documentElement.style.setProperty('--brand-l', '${hsl.l}%', 'important');
                  document.documentElement.style.setProperty('--primary', '${primaryValue}', 'important');
                  
                  // Verify it was applied
                  const appliedH = document.documentElement.style.getPropertyValue('--brand-h');
                  console.log('[AdminColorStyle] Verified --brand-h:', appliedH);
                } else {
                  console.warn('[AdminColorStyle] No documentElement available!');
                }
                
                // Save to sessionStorage for next page load
                try {
                  sessionStorage.setItem('primary-color', '${styleColor.replace(/'/g, "\\'")}');
                  console.log('[AdminColorStyle] Saved to sessionStorage:', '${styleColor}');
                } catch (e) {
                  console.error('[AdminColorStyle] Failed to save to sessionStorage:', e);
                }
                
                const endTime = performance.now();
                console.log('[AdminColorStyle] Completed in', (endTime - startTime).toFixed(2) + 'ms');
              })();
            `,
          }}
        />
      </>
    )
  } catch (error) {
    console.error("Failed to initialize color style:", error)
    return null
  }
}

