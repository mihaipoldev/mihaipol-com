"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { rgbToHsl, hslToRgb } from "@/lib/colorUtils";

type AlbumBackgroundGradientProps = {
  coverImageUrl: string | null | undefined;
  children: React.ReactNode;
  className?: string;
};

// Calculate relative luminance (simplified)
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Subtly lighten very dark colors only, preserving the original character
function adjustDarkColor(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const luminance = getLuminance(r, g, b);

  // Only adjust if it's very dark (luminance < 0.1)
  if (luminance < 0.1) {
    const hsl = rgbToHsl(r, g, b);
    // Gently increase lightness, preserving hue and saturation
    hsl.l = Math.max(hsl.l, 15); // Minimum 15% lightness
    return hslToRgb(hsl.h, hsl.s, hsl.l);
  }

  return { r, g, b };
}

// Function to extract dominant colors from an image
function extractColors(
  imageUrl: string
): Promise<{ gradientColors: string[] }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Resize image for faster processing
        const maxSize = 100;
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Sample colors from different regions
        const colors: { r: number; g: number; b: number; count: number }[] = [];
        const sampleStep = 10; // Sample every 10th pixel

        for (let i = 0; i < data.length; i += 4 * sampleStep) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Find similar color in our palette
          let found = false;
          for (const color of colors) {
            const distance = Math.sqrt(
              Math.pow(color.r - r, 2) + Math.pow(color.g - g, 2) + Math.pow(color.b - b, 2)
            );
            if (distance < 30) {
              // Similar color found, average it
              color.r = Math.round((color.r * color.count + r) / (color.count + 1));
              color.g = Math.round((color.g * color.count + g) / (color.count + 1));
              color.b = Math.round((color.b * color.count + b) / (color.count + 1));
              color.count++;
              found = true;
              break;
            }
          }

          if (!found) {
            colors.push({ r, g, b, count: 1 });
          }
        }

        // Sort by frequency and get top 3 colors
        colors.sort((a, b) => b.count - a.count);

        // Only adjust very dark colors, keep others as-is
        const allColors = colors.slice(0, 3).map((c) => {
          const adjusted = adjustDarkColor(c.r, c.g, c.b);
          return `rgb(${Math.round(adjusted.r)}, ${Math.round(adjusted.g)}, ${Math.round(adjusted.b)})`;
        });

        // Ensure we have at least 3 colors
        while (allColors.length < 3) {
          allColors.push(allColors[allColors.length - 1] || "rgb(100, 100, 100)");
        }

        resolve({
          gradientColors: allColors.slice(0, 3),
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = imageUrl;
  });
}

// Convert rgb to rgba helper
const rgbToRgba = (rgb: string, opacity: number) => {
  return rgb.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
};

export default function AlbumBackgroundGradient({
  coverImageUrl,
  children,
  className = "",
}: AlbumBackgroundGradientProps) {
  const { theme, resolvedTheme } = useTheme();
  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine if we're in dark mode
  const isDark = resolvedTheme === "dark" || theme === "dark";

  useEffect(() => {
    if (!coverImageUrl) {
      // Fallback colors if no image
      const fallbackGradient = [
        "rgb(59, 130, 246)", // blue-500
        "rgb(147, 197, 253)", // blue-300
        "rgb(203, 213, 225)", // slate-300
      ];
      setGradientColors(fallbackGradient);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    extractColors(coverImageUrl)
      .then((result) => {
        setGradientColors(result.gradientColors);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error extracting colors:", error);
        // Fallback colors on error
        const fallbackGradient = ["rgb(59, 130, 246)", "rgb(147, 197, 253)", "rgb(203, 213, 225)"];
        setGradientColors(fallbackGradient);
        setIsLoading(false);
      });
  }, [coverImageUrl]);

  const fallbackGradient = [
    "rgb(59, 130, 246)", // blue-500
    "rgb(147, 197, 253)", // blue-300
    "rgb(203, 213, 225)", // slate-300
  ];

  const colors = isLoading || gradientColors.length === 0 ? fallbackGradient : gradientColors;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Blurred album cover as background */}
      {coverImageUrl && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${coverImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            filter: isDark 
              ? "blur(60px) brightness(0.8) saturate(1)" 
              : "blur(60px) brightness(1.5)",
            transform: "scale(2)",
            transformOrigin: "center center",
            opacity: isDark ? 0.4 : 0.9,
          }}
        />
      )}

      {/* Base layer with gradient - different for light/dark */}
      {colors.length >= 3 && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: isDark
              ? `linear-gradient(135deg, ${rgbToRgba(colors[0], 0.4)} 0%, ${rgbToRgba(colors[1], 0.3)} 50%, ${rgbToRgba(colors[2], 0.4)} 100%)`
              : `linear-gradient(135deg, ${rgbToRgba(colors[0], 0.3)} 0%, ${rgbToRgba(colors[1], 0.2)} 50%, ${rgbToRgba(colors[2], 0.3)} 100%), white`,
            opacity: isDark ? 0.6 : 0.5,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-0">{children}</div>
    </div>
  );
}
