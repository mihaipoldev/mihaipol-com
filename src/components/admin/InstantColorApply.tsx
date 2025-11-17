import Script from "next/script"

/**
 * Component that applies color from sessionStorage INSTANTLY before React loads
 * This prevents FOUC (Flash of Unstyled Content) by applying colors synchronously
 * 
 * Flow: Database → applyPrimaryColor() → sessionStorage → this script reads on next load
 * This gives us instant theme application while database remains source of truth ✅
 */
export function InstantColorApply() {
  return (
    <Script
      id="instant-color-apply"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const startTime = performance.now();
            console.log('[InstantColorApply] Starting at', startTime.toFixed(2) + 'ms');
            console.log('[InstantColorApply] Document readyState:', document.readyState);
            
            try {
              // Only read from sessionStorage (NOT localStorage - that has old data)
              const getSessionValue = (key, defaultValue) => {
                try {
                  return sessionStorage.getItem(key) || defaultValue;
                } catch (e) {
                  console.log('[InstantColorApply] sessionStorage error:', e);
                  return defaultValue;
                }
              };
              
              // Apply brand color from sessionStorage ONLY if AdminColorStyle hasn't already applied
              // Check if admin color was already applied by looking for the style tag
              const adminStyleApplied = document.getElementById('admin-color-inline');
              console.log('[InstantColorApply] Checking for admin-color-inline style:', !!adminStyleApplied);
              
              if (adminStyleApplied) {
                console.log('[InstantColorApply] AdminColorStyle already applied - SKIPPING');
                return;
              }
              
              const savedColor = getSessionValue('primary-color', '');
              console.log('[InstantColorApply] Retrieved from sessionStorage:', savedColor || '(empty)');
              
              if (savedColor && savedColor.startsWith('#')) {
                console.log('[InstantColorApply] Processing color:', savedColor);
                // Convert hex to HSL inline (simple version for initial render)
                const hex = savedColor.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16) / 255;
                const g = parseInt(hex.substr(2, 2), 16) / 255;
                const b = parseInt(hex.substr(4, 2), 16) / 255;
                
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                let h = 0, s = 0, l = (max + min) / 2;
                
                if (max !== min) {
                  const d = max - min;
                  s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                  switch (max) {
                    case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                    case g: h = ((b - r) / d + 2) / 6; break;
                    case b: h = ((r - g) / d + 4) / 6; break;
                  }
                }
                
                h = Math.round(h * 360);
                s = Math.round(s * 100);
                l = Math.round(l * 100);
                
                const primaryValue = h + ' ' + s + '% ' + l + '%';
                console.log('[InstantColorApply] Converted to HSL:', {h, s, l}, 'primaryValue:', primaryValue);
                
                // Apply IMMEDIATELY to documentElement (before React hydrates, so no hydration mismatch)
                // This runs in beforeInteractive script before React even starts
                if (document.documentElement) {
                  console.log('[InstantColorApply] Applying inline styles to documentElement');
                  document.documentElement.style.setProperty('--brand-h', h.toString(), 'important');
                  document.documentElement.style.setProperty('--brand-s', s + '%', 'important');
                  document.documentElement.style.setProperty('--brand-l', l + '%', 'important');
                  document.documentElement.style.setProperty('--primary', primaryValue, 'important');
                  
                  // Verify it was applied
                  const appliedH = document.documentElement.style.getPropertyValue('--brand-h');
                  console.log('[InstantColorApply] Verified --brand-h:', appliedH);
                } else {
                  console.warn('[InstantColorApply] No documentElement available!');
                }
                
                // Also inject style tag for persistence (runs after inline styles)
                const applyStyle = () => {
                  const styleId = 'instant-color-apply-style';
                  if (!document.getElementById(styleId)) {
                    console.log('[InstantColorApply] Creating style tag with id:', styleId);
                    const styleEl = document.createElement('style');
                    styleEl.id = styleId;
                    styleEl.textContent = ':root,html,body,.preset-balanced,body.preset-balanced{--brand-h:' + h + '!important;--brand-s:' + s + '%!important;--brand-l:' + l + '%!important;--primary:' + primaryValue + '!important;}';
                    if (document.head) {
                      document.head.insertBefore(styleEl, document.head.firstChild);
                      console.log('[InstantColorApply] Inserted style tag into head');
                    } else {
                      console.warn('[InstantColorApply] No document.head available for style tag');
                    }
                  } else {
                    console.log('[InstantColorApply] Style tag already exists');
                  }
                };
                
                // Apply style tag immediately or wait for head
                if (document.head) {
                  applyStyle();
                } else {
                  console.log('[InstantColorApply] No head yet, setting up observer');
                  // If head doesn't exist yet, wait for it
                  const observer = new MutationObserver(function(mutations) {
                    if (document.head) {
                      console.log('[InstantColorApply] Head appeared, applying style');
                      applyStyle();
                      observer.disconnect();
                    }
                  });
                  observer.observe(document.documentElement, { childList: true });
                  // Also try immediately in case it's already there
                  applyStyle();
                }
                
                const endTime = performance.now();
                console.log('[InstantColorApply] Completed in', (endTime - startTime).toFixed(2) + 'ms');
              } else {
                console.log('[InstantColorApply] No valid color in sessionStorage, skipping');
              }
              
            } catch (e) {
              console.error('[InstantColorApply] Error:', e);
            }
          })();
        `,
      }}
    />
  )
}

