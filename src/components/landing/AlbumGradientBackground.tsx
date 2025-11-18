"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { rgbToHsl, hslToRgb } from "@/lib/colorUtils";

type AlbumGradientBackgroundProps = {
  coverImageUrl: string | null | undefined;
  children: React.ReactNode;
};

// Context to provide album colors to children
const AlbumColorsContext = createContext<{
  colors: string[];
  textColor: string;
  mutedColor: string;
  cardBgColor: string;
  linkButtonBgColor: string;
  linkHoverBgColor: string;
  linkTextColor: string;
  colorsReady: boolean;
}>({
  colors: [],
  textColor: "hsl(var(--foreground))",
  mutedColor: "hsl(var(--muted-foreground))",
  cardBgColor: "hsl(var(--card))",
  linkButtonBgColor: "rgba(0, 0, 0, 0.05)",
  linkHoverBgColor: "rgba(0, 0, 0, 0.08)",
  linkTextColor: "hsl(var(--foreground))",
  colorsReady: false,
});

// Calculate relative luminance (simplified)
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Calculate appropriate text color - always black
function calculateTextColor(colors: string[]): string {
  return "rgba(0, 0, 0, 0.95)";
}

// Calculate muted color - always dark gray
function calculateMutedColor(colors: string[]): string {
  return "rgba(0, 0, 0, 0.7)";
}

// Calculate card background color that blends with album colors
function calculateCardBgColor(colors: string[]): string {
  if (colors.length === 0) {
    return "rgba(255, 255, 255, 0.5)";
  }

  // Use the first color and create a very subtle background
  const rgbMatch = colors[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    return "rgba(255, 255, 255, 0.5)";
  }

  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Convert to HSL and adjust for light background
  const hsl = rgbToHsl(r, g, b);
  hsl.s = hsl.s * 0.1; // Very low saturation
  // Ensure it's very light (90-98% lightness)
  hsl.l = Math.max(90, Math.min(98, hsl.l + (100 - hsl.l) * 0.7));

  const bgRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  const opacity = 0.4;

  return `rgba(${Math.round(bgRgb.r)}, ${Math.round(bgRgb.g)}, ${Math.round(bgRgb.b)}, ${opacity})`;
}

// Calculate link button background - dark grayish button
function calculateLinkButtonBgColor(colors: string[]): string {
  // Fallback color if no album colors
  if (colors.length === 0) {
    return "rgba(0, 0, 0, 0.08)";
  }

  // Get the first album color
  const rgbMatch = colors[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    return "rgba(0, 0, 0, 0.08)";
  }

  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Light theme: dark grayish button (30% lightness, low saturation)
  const hsl = rgbToHsl(r, g, b);
  hsl.s = hsl.s * 0.1; // Very low saturation = more gray
  hsl.l = 30; // Dark gray
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, 0.15)`;
}

// Calculate link hover background - slightly darker than button
function calculateLinkHoverBgColor(colors: string[]): string {
  // Fallback color if no album colors
  if (colors.length === 0) {
    return "rgba(0, 0, 0, 0.12)";
  }

  // Get the first album color
  const rgbMatch = colors[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    return "rgba(0, 0, 0, 0.12)";
  }

  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Light theme: slightly darker gray (25% lightness)
  const hsl = rgbToHsl(r, g, b);
  hsl.s = hsl.s * 0.1;
  hsl.l = 25;
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, 0.2)`;
}

// Calculate link text color - same as main text color
function calculateLinkTextColor(colors: string[]): string {
  return calculateTextColor(colors);
}

// Export hook to use album colors
export function useAlbumColors() {
  return useContext(AlbumColorsContext);
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
): Promise<{ gradientColors: string[]; dotColors: string[] }> {
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

        // Sort by frequency and get top 6 colors (3 for gradient, 3 for dots)
        colors.sort((a, b) => b.count - a.count);

        // Only adjust very dark colors, keep others as-is
        const allColors = colors.slice(0, 6).map((c) => {
          const adjusted = adjustDarkColor(c.r, c.g, c.b);
          return `rgb(${Math.round(adjusted.r)}, ${Math.round(adjusted.g)}, ${Math.round(adjusted.b)})`;
        });

        // Ensure we have at least 6 colors
        while (allColors.length < 6) {
          allColors.push(allColors[allColors.length - 1] || "rgb(100, 100, 100)");
        }

        // Return top 3 for gradient and next 3 for dots (for contrast)
        resolve({
          gradientColors: allColors.slice(0, 3),
          dotColors: allColors.slice(3, 6),
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

export default function AlbumGradientBackground({
  coverImageUrl,
  children,
}: AlbumGradientBackgroundProps) {
  // Force light theme while on this page, restore original on unmount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Store original theme state
      const wasDark = document.documentElement.classList.contains('dark');
      
      // Force light theme
      document.documentElement.classList.remove('dark');
      
      // Prevent theme changes while on this page
      const observer = new MutationObserver(() => {
        if (document.documentElement.classList.contains('dark')) {
          document.documentElement.classList.remove('dark');
        }
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      
      // Restore original theme when component unmounts
      return () => {
        observer.disconnect();
        if (wasDark) {
          document.documentElement.classList.add('dark');
        }
      };
    }
  }, []);

  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const [dotColors, setDotColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize colors
  const getInitialColors = () => ({
    textColor: calculateTextColor([]),
    mutedColor: calculateMutedColor([]),
    cardBgColor: calculateCardBgColor([]),
    linkButtonBgColor: calculateLinkButtonBgColor([]),
    linkHoverBgColor: calculateLinkHoverBgColor([]),
    linkTextColor: calculateLinkTextColor([]),
  });
  
  const initialColors = getInitialColors();
  const [textColor, setTextColor] = useState<string>(initialColors.textColor);
  const [mutedColor, setMutedColor] = useState<string>(initialColors.mutedColor);
  const [cardBgColor, setCardBgColor] = useState<string>(initialColors.cardBgColor);
  const [linkButtonBgColor, setLinkButtonBgColor] = useState<string>(initialColors.linkButtonBgColor);
  const [linkHoverBgColor, setLinkHoverBgColor] = useState<string>(initialColors.linkHoverBgColor);
  const [linkTextColor, setLinkTextColor] = useState<string>(initialColors.linkTextColor);

  useEffect(() => {
    if (!coverImageUrl) {
      // Fallback colors if no image
      const fallbackGradient = [
        "rgb(59, 130, 246)", // blue-500
        "rgb(147, 197, 253)", // blue-300
        "rgb(203, 213, 225)", // slate-300
      ];
      const fallbackDots = [
        "rgb(99, 102, 241)", // indigo-500
        "rgb(168, 85, 247)", // purple-500
        "rgb(236, 72, 153)", // pink-500
      ];
      setGradientColors(fallbackGradient);
      setDotColors(fallbackDots);
      setTextColor(calculateTextColor(fallbackGradient));
      setMutedColor(calculateMutedColor(fallbackGradient));
      setCardBgColor(calculateCardBgColor(fallbackGradient));
      setLinkButtonBgColor(calculateLinkButtonBgColor(fallbackGradient));
      setLinkHoverBgColor(calculateLinkHoverBgColor(fallbackGradient));
      setLinkTextColor(calculateLinkTextColor(fallbackGradient));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    extractColors(coverImageUrl)
      .then((result) => {
        setGradientColors(result.gradientColors);
        setDotColors(result.dotColors);
        setTextColor(calculateTextColor(result.gradientColors));
        setMutedColor(calculateMutedColor(result.gradientColors));
        setCardBgColor(calculateCardBgColor(result.gradientColors));
        setLinkButtonBgColor(calculateLinkButtonBgColor(result.gradientColors));
        setLinkHoverBgColor(calculateLinkHoverBgColor(result.gradientColors));
        setLinkTextColor(calculateLinkTextColor(result.gradientColors));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error extracting colors:", error);
        // Fallback colors on error
        const fallbackGradient = ["rgb(59, 130, 246)", "rgb(147, 197, 253)", "rgb(203, 213, 225)"];
        const fallbackDots = ["rgb(99, 102, 241)", "rgb(168, 85, 247)", "rgb(236, 72, 153)"];
        setGradientColors(fallbackGradient);
        setDotColors(fallbackDots);
        setTextColor(calculateTextColor(fallbackGradient));
        setMutedColor(calculateMutedColor(fallbackGradient));
        setCardBgColor(calculateCardBgColor(fallbackGradient));
        setLinkButtonBgColor(calculateLinkButtonBgColor(fallbackGradient));
        setLinkHoverBgColor(calculateLinkHoverBgColor(fallbackGradient));
        setLinkTextColor(calculateLinkTextColor(fallbackGradient));
        setIsLoading(false);
      });
  }, [coverImageUrl]);


  // Convert rgb to rgba helper
  const rgbToRgba = (rgb: string, opacity: number) => {
    return rgb.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  };

  if (isLoading || gradientColors.length === 0) {
    const loadingTextColor = calculateTextColor([]);
    const loadingMutedColor = calculateMutedColor([]);
    const loadingCardBgColor = calculateCardBgColor([]);
    const loadingLinkButtonBgColor = calculateLinkButtonBgColor([]);
    const loadingLinkHoverBgColor = calculateLinkHoverBgColor([]);
    const loadingLinkTextColor = calculateLinkTextColor([]);
    return (
      <AlbumColorsContext.Provider
        value={{
          colors: [],
          textColor: loadingTextColor,
          mutedColor: loadingMutedColor,
          cardBgColor: loadingCardBgColor,
          linkButtonBgColor: loadingLinkButtonBgColor,
          linkHoverBgColor: loadingLinkHoverBgColor,
          linkTextColor: loadingLinkTextColor,
          colorsReady: false,
        }}
      >
        {/* Blurred album cover as background - positioned outside main container */}
        {coverImageUrl && (
          <div
            className="fixed inset-0"
            style={{
              zIndex: 0,
              backgroundImage: `url(${coverImageUrl})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              filter: "blur(100px) brightness(1.5)",
              transform: "scale(2)", // Scale up to avoid blur edges
              opacity: 0.5,
            }}
          />
        )}

        <div
          className={`fixed inset-0 z-[100] h-screen flex flex-col`}
          style={{ background: "transparent" }}
        >
          {children}
        </div>
      </AlbumColorsContext.Provider>
    );
  }

  return (
    <AlbumColorsContext.Provider
      value={{
        colors: gradientColors,
        textColor,
        mutedColor,
        cardBgColor,
        linkButtonBgColor,
        linkHoverBgColor,
        linkTextColor,
        colorsReady: true,
      }}
    >
          {/* Blurred album cover as background - positioned outside main container */}
          {coverImageUrl && (
            <div
              className="fixed inset-0"
              style={{
                zIndex: 0,
                backgroundImage: `url(${coverImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(100px) brightness(1.5)",
                transform: "scale(2)", // Scale up to avoid blur edges
                opacity: 0.5,
              }}
            />
          )}

      <div
        className="fixed inset-0 z-[100] h-screen flex flex-col"
        style={{ background: "transparent" }}
      >
        {children}
      </div>
    </AlbumColorsContext.Provider>
  );
}
