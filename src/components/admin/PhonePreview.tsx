"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import SmartLinksPage from "@/features/smart-links/components/SmartLinksPage";
import SmartLinksGradientBackground from "@/features/smart-links/layout/SmartLinksGradientBackground";
import type { Album, AlbumLink } from "@/features/albums/types";
import type { SmartLink } from "@/features/smart-links/data";

// Phone preview colors - can be easily changed later (currently unused, kept for future use)
const PHONE_PREVIEW_COLORS = {
  // addressBarBg: '#5e6367',        // Address bar background - now using bg-background
} as const;

// Cache for extracted colors to avoid re-processing the same image
const colorCache = new Map<string, string>();

type PhonePreviewProps = {
  album: Album | null;
  links: AlbumLink[];
};

export function PhonePreview({ album, links }: PhonePreviewProps) {
  const [phoneColor, setPhoneColor] = useState<string>("#1f2937"); // Default gray

  // Extract dominant color from cover image for phone frame
  useEffect(() => {
    const extractColorFromImage = async (imageUrl: string) => {
      // Check cache first
      const cachedColor = colorCache.get(imageUrl);
      if (cachedColor) {
        setPhoneColor(cachedColor);
        return;
      }

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

          const extractedColor = `rgb(${r}, ${g}, ${b})`;
          
          // Cache the extracted color
          colorCache.set(imageUrl, extractedColor);
          
          // Limit cache size to prevent memory leaks (keep last 50)
          if (colorCache.size > 50) {
            const firstKey = colorCache.keys().next().value;
            if (firstKey !== undefined) {
              colorCache.delete(firstKey);
            }
          }
          
          setPhoneColor(extractedColor);
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
    <motion.div
      className="hidden lg:block w-full"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: 0.2,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <div className="sticky top-6 flex justify-center items-start w-full">
        <div
          className="relative"
          style={{ transform: "scale(0.6)", transformOrigin: "top center", marginTop: "-14px" }}
        >
          {/* Phone Frame */}
          <div
            className="relative mx-auto border-radius-full"
            style={{ width: "430px", height: "880px" }}
          >
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
                height: "865px",
                marginTop: "20px",
                borderTopLeftRadius: "80px",
                borderTopRightRadius: "80px",
                borderBottomLeftRadius: "70px",
                borderBottomRightRadius: "70px",
                position: "relative",
                overflow: "hidden",
                clipPath: "inset(0 round 70px)",
                backgroundColor: "white",
              }}
            >
              {/* Status Bar */}
              <div className="absolute top-[19px] h-14 text-center align-middle left-0 right-0 bg-white/100 z-20 flex text-sm font-semibold text-foreground">
                <span className="ml-12 text-xl text-black font-bold pt-[15px]">10:24</span>
                <div className="flex items-center gap-1 ml-[165px] mt-[0px] !bg-white/95">
                  {/* Signal bars */}
                  <img src="/apple-signal.png" alt="Signal" className="h-5 w-auto object-contain bg-transparent !bg-white/95" />
                  {/* Wi-Fi icon */}
                  <img
                    src="/apple-wifi-icon-17.jpg"
                    alt="Wi-Fi"
                    className="h-6 -ml-[4px] -mt-[4px] w-auto object-contain bg-transparent"
                  />
                  {/* Battery */}
                  <img
                    src="/apple-battery.jpg"
                    alt="Battery"
                    className="h-8 w-auto object-contain ml-[2px] bg-transparent"
                  />
                </div>
              </div>

              {/* Safari Browser Bar */}
              <div className="absolute top-[70px] left-0 right-0 h-12 bg-white/100 backdrop-blur-xl z-20 flex items-center justify-center px-3 border-b border-border/20">
                <div className="flex items-center justify-center gap-2 px-6">
                  {/* Address Bar */}
                  <div className="rounded-full px-4 py-1.5 flex items-center justify-center gap-2 bg-gray-200">
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
                    <span className="text-black text-md font-medium">mihaipol.com</span>
                  </div>
                </div>
              </div>

              {/* Screen Content */}
              <div className="absolute top-[118px] left-0 right-0 bottom-0" style={{ zIndex: 1 }}>
                <SmartLinksGradientBackground
                  coverImageUrl={album.cover_image_url || null}
                  useAbsolutePositioning={true}
                >
                  <div className="flex-1 relative z-10 min-h-0 flex flex-col">
                    <div className="flex flex-col items-center px-4 flex-1">
                      <div className="w-full max-w-sm mx-auto py-6">
                        <div className="flex flex-col">
                          <SmartLinksPage
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
                                platformName: link.platforms?.name || "Unknown",
                                platformIconUrl: link.platforms?.icon_url || null,
                                platformIconHorizontalUrl:
                                  link.platforms?.icon_horizontal_url || null,
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
                </SmartLinksGradientBackground>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
