import Script from "next/script";

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
            try {
              // Only read from sessionStorage (NOT localStorage - that has old data)
              const getSessionValue = (key, defaultValue) => {
                try {
                  return sessionStorage.getItem(key) || defaultValue;
                } catch (e) {
                  return defaultValue;
                }
              };
              
              // Apply brand color from sessionStorage ONLY if AdminColorStyle hasn't already applied
              // Check if admin color was already applied by looking for the style tag
              const adminStyleApplied = document.getElementById('admin-color-inline');
              
              if (adminStyleApplied) {
                return;
              }
              
              const savedColor = getSessionValue('primary-color', '');
              
              if (savedColor && savedColor.startsWith('#')) {
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
                
                // Apply IMMEDIATELY to documentElement (before React hydrates, so no hydration mismatch)
                // This runs in beforeInteractive script before React even starts
                if (document.documentElement) {
                  document.documentElement.style.setProperty('--brand-h', h.toString(), 'important');
                  document.documentElement.style.setProperty('--brand-s', s + '%', 'important');
                  document.documentElement.style.setProperty('--brand-l', l + '%', 'important');
                  document.documentElement.style.setProperty('--primary', primaryValue, 'important');
                }
                
                // Also inject style tag for persistence (runs after inline styles)
                const applyStyle = () => {
                  const styleId = 'instant-color-apply-style';
                  if (!document.getElementById(styleId)) {
                    const styleEl = document.createElement('style');
                    styleEl.id = styleId;
                    styleEl.textContent = ':root,html,body,.preset-balanced,body.preset-balanced{--brand-h:' + h + '!important;--brand-s:' + s + '%!important;--brand-l:' + l + '%!important;--primary:' + primaryValue + '!important;}';
                    if (document.head) {
                      document.head.insertBefore(styleEl, document.head.firstChild);
                    }
                  }
                };
                
                // Apply style tag immediately or wait for head
                if (document.head) {
                  applyStyle();
                } else {
                  // If head doesn't exist yet, wait for it
                  const observer = new MutationObserver(function(mutations) {
                    if (document.head) {
                      applyStyle();
                      observer.disconnect();
                    }
                  });
                  observer.observe(document.documentElement, { childList: true });
                  // Also try immediately in case it's already there
                  applyStyle();
                }
              }
              
            } catch (e) {
              // Error applying color
            }
          })();
        `,
      }}
    />
  );
}
