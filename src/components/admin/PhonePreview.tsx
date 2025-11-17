"use client";

import { useEffect, useState } from "react";
import SmartLinksLanding from "@/features/smart-links/components/SmartLinksLanding";
import type { Album, AlbumLink } from "@/features/albums/types";
import type { SmartLink } from "@/features/smart-links/data";

// Phone preview colors - can be easily changed later (currently unused, kept for future use)
const PHONE_PREVIEW_COLORS = {
  // addressBarBg: '#5e6367',        // Address bar background - now using bg-background
} as const;

type PhonePreviewProps = {
  album: Album | null;
  links: AlbumLink[];
};

export function PhonePreview({ album, links }: PhonePreviewProps) {
  const [phoneColor, setPhoneColor] = useState<string>("#1f2937"); // Default gray

  // Extract dominant color from cover image for phone frame
  useEffect(() => {
    const extractColorFromImage = async (imageUrl: string) => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Sample pixels from the image (top-left corner area)
        const imageData = ctx.getImageData(
          0,
          0,
          Math.min(100, img.width),
          Math.min(100, img.height)
        );
        const data = imageData.data;

        // Calculate average color
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 16) {
          // Sample every 4th pixel
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }

        if (count > 0) {
          r = Math.floor(r / count);
          g = Math.floor(g / count);
          b = Math.floor(b / count);

          // Darken the color for phone frame
          r = Math.floor(r * 0.3);
          g = Math.floor(g * 0.3);
          b = Math.floor(b * 0.3);

          setPhoneColor(`rgb(${r}, ${g}, ${b})`);
        }
      } catch (error) {
        console.error("Error extracting color from image:", error);
      }
    };

    if (album?.cover_image_url) {
      extractColorFromImage(album.cover_image_url);
    } else {
      setPhoneColor("#1f2937"); // Reset to default
    }
  }, [album?.cover_image_url]);

  if (!album) {
    return null;
  }

  return (
    <div className="hidden lg:block lg:col-span-2">
      <div
        className="sticky top-6 flex justify-center"
        style={{ maxHeight: "600px", overflow: "hidden" }}
      >
        <div
          className="relative"
          style={{ transform: "scale(0.6)", transformOrigin: "top center", marginTop: "-20px" }}
        >
          {/* Phone Frame */}
          <div className="relative mx-auto" style={{ width: "430px", height: "932px" }}>
            <img
              src="/phone.png"
              alt="Phone frame"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-30"
            />
            {/* Phone Screen */}
            <div
              className="relative z-10 mx-auto"
              style={{
                width: "390px",
                height: "900px",
                marginTop: "20px",
                borderTopLeftRadius: "70px",
                borderTopRightRadius: "70px",
                borderBottomLeftRadius: "70px",
                borderBottomRightRadius: "70px",
                position: "relative",
                overflow: "hidden",
                clipPath: "inset(0 round 70px)",
              }}
            >
              {/* Status Bar */}
              <div className="absolute top-[60px] left-0 right-0 h-8 bg-transparent z-20 flex text-sm font-semibold text-foreground">
                <span className="ml-12 text-xl font-bold">10:24</span>
                <div className="flex items-center gap-1 ml-[165px] -mt-[4px]">
                  {/* Signal bars */}
                  <img src="/apple-signal.png" alt="Signal" className="h-5 w-auto object-contain" />
                  {/* Wi-Fi icon */}
                  <img
                    src="/apple-wifi-icon-17.jpg"
                    alt="Wi-Fi"
                    className="h-6 -ml-[4px] -mt-[4px] w-auto object-contain"
                  />
                  {/* Battery */}
                  <img
                    src="/apple-battery.jpg"
                    alt="Battery"
                    className="h-8 w-auto object-contain ml-[2px]"
                  />
                </div>
              </div>

              {/* Safari Browser Bar */}
              <div className="absolute top-[86px] left-0 right-0 h-12 bg-transparent backdrop-blur-xl z-20 flex items-center justify-center px-3 border-b border-border/20">
                <div className="flex items-center justify-center gap-2 px-6">
                  {/* Address Bar */}
                  <div className="rounded-full px-4 py-1.5 flex items-center justify-center gap-2 bg-background">
                    <svg
                      className="w-3 h-3 text-foreground/70"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span className="text-foreground text-md font-medium">mihaipol.com</span>
                  </div>
                </div>
              </div>

              {/* Screen Content */}
              <div
                className="absolute top-[132px] left-0 right-0 bottom-0 overflow-y-auto"
                style={{ zIndex: 1 }}
              >
                <div className="mobile-preview-wrapper">
                  <style
                    dangerouslySetInnerHTML={{
                      __html: `
                      .mobile-preview-wrapper > div {
                        position: relative !important;
                        inset: 0 !important;
                        height: auto !important;
                        min-height: 100% !important;
                        z-index: 1 !important;
                      }
                    `,
                    }}
                  />
                  <SmartLinksLanding
                    album={{
                      id: album.id,
                      title: album.title,
                      slug: album.slug,
                      artistName: null,
                      catalog_number: album.catalog_number || null,
                      coverImageUrl: album.cover_image_url || null,
                    }}
                    links={links.map(
                      (link): SmartLink => ({
                        id: link.id,
                        url: link.url,
                        platformName:
                          link.platforms?.display_name || link.platforms?.name || "Unknown",
                        platformIconUrl: null,
                        ctaLabel: link.cta_label || null,
                      })
                    )}
                    showDebug={false}
                    disableTracking={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
