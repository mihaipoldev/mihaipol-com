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
}>({
  colors: [],
  textColor: "hsl(var(--foreground))",
  mutedColor: "hsl(var(--muted-foreground))",
  cardBgColor: "hsl(var(--card))",
});

// Calculate relative luminance (simplified)
function getLuminance(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// Calculate appropriate text color based on album colors
function calculateTextColor(colors: string[], isDark: boolean): string {
  // In dark mode, always use light text since the background is dark
  if (isDark) {
    return "rgba(255, 255, 255, 0.9)";
  }

  // In light mode, determine based on album colors
  if (colors.length === 0) {
    return "rgba(0, 0, 0, 0.8)";
  }

  // Calculate average luminance of all colors
  let totalLuminance = 0;
  for (const color of colors) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      totalLuminance += getLuminance(parseInt(match[1]), parseInt(match[2]), parseInt(match[3]));
    }
  }
  const avgLuminance = totalLuminance / colors.length;

  // In light mode: if album colors are very dark, use light text; otherwise use dark text
  if (avgLuminance < 0.3) {
    // Very dark album colors - use light text for contrast
    return "rgba(255, 255, 255, 0.9)";
  } else {
    // Light or medium album colors - use dark text
    return "rgba(0, 0, 0, 0.8)";
  }
}

// Calculate muted color (for descriptions) - a gray that goes towards the artwork
function calculateMutedColor(colors: string[], isDark: boolean): string {
  // In dark mode, always use light muted text
  if (isDark) {
    return "rgba(255, 255, 255, 0.65)";
  }

  // In light mode, create a muted color from album colors
  if (colors.length === 0) {
    return "rgba(0, 0, 0, 0.6)";
  }

  // Use the first color (most dominant) and desaturate it to create a muted gray
  const rgbMatch = colors[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    return "rgba(0, 0, 0, 0.6)";
  }

  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Convert to HSL
  const hsl = rgbToHsl(r, g, b);

  // Desaturate significantly (reduce saturation to 10-20%) and adjust lightness
  // This creates a gray that still has a hint of the artwork color
  hsl.s = Math.max(10, hsl.s * 0.15); // Keep 15% of saturation
  hsl.l = Math.max(40, hsl.l - 10); // Adjust lightness for light mode

  const mutedRgb = hslToRgb(hsl.h, hsl.s, hsl.l);

  return `rgba(${Math.round(mutedRgb.r)}, ${Math.round(mutedRgb.g)}, ${Math.round(mutedRgb.b)}, 0.65)`;
}

// Calculate card background color that blends with album colors
// Lower opacity for better blur effect (glassmorphism)
function calculateCardBgColor(colors: string[], isDark: boolean): string {
  if (colors.length === 0) {
    return isDark ? "rgba(31, 41, 55, 0.4)" : "rgba(255, 255, 255, 0.5)";
  }

  // Use the first color and create a very subtle background
  const rgbMatch = colors[0].match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!rgbMatch) {
    return isDark ? "rgba(31, 41, 55, 0.4)" : "rgba(255, 255, 255, 0.5)";
  }

  const r = parseInt(rgbMatch[1]);
  const g = parseInt(rgbMatch[2]);
  const b = parseInt(rgbMatch[3]);

  // Convert to HSL and adjust for background
  const hsl = rgbToHsl(r, g, b);

  // For light theme: make it very light with low saturation
  // For dark theme: make it darker with low saturation
  hsl.s = hsl.s * 0.1; // Very low saturation
  hsl.l = isDark ? Math.min(15, hsl.l * 0.3) : Math.max(95, 100 - hsl.l * 0.1);

  const bgRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  // Lower opacity for better blur visibility (glassmorphism effect)
  const opacity = isDark ? 0.3 : 0.4;

  return `rgba(${Math.round(bgRgb.r)}, ${Math.round(bgRgb.g)}, ${Math.round(bgRgb.b)}, ${opacity})`;
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
  const [gradientColors, setGradientColors] = useState<string[]>([]);
  const [dotColors, setDotColors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [textColor, setTextColor] = useState<string>("hsl(var(--foreground))");
  const [mutedColor, setMutedColor] = useState<string>("hsl(var(--muted-foreground))");
  const [cardBgColor, setCardBgColor] = useState<string>("hsl(var(--card))");

  // Detect dark mode - must be called before any early returns
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    extractColors(coverImageUrl)
      .then((result) => {
        setGradientColors(result.gradientColors);
        setDotColors(result.dotColors);
        setTextColor(calculateTextColor(result.gradientColors, isDark));
        setMutedColor(calculateMutedColor(result.gradientColors, isDark));
        setCardBgColor(calculateCardBgColor(result.gradientColors, isDark));
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error extracting colors:", error);
        // Fallback colors on error
        const fallbackGradient = ["rgb(59, 130, 246)", "rgb(147, 197, 253)", "rgb(203, 213, 225)"];
        const fallbackDots = ["rgb(99, 102, 241)", "rgb(168, 85, 247)", "rgb(236, 72, 153)"];
        setGradientColors(fallbackGradient);
        setDotColors(fallbackDots);
        setTextColor(calculateTextColor(fallbackGradient, isDark));
        setMutedColor(calculateMutedColor(fallbackGradient, isDark));
        setCardBgColor(calculateCardBgColor(fallbackGradient, isDark));
        setIsLoading(false);
      });
  }, [coverImageUrl, isDark]);

  // Default gradient while loading or if no colors
  const defaultGradient =
    "bg-gradient-to-br from-blue-50 via-blue-100/50 to-slate-100 dark:from-slate-900 dark:via-blue-950/30 dark:to-slate-800";

  // Update colors when dark mode changes
  useEffect(() => {
    if (gradientColors.length > 0) {
      setTextColor(calculateTextColor(gradientColors, isDark));
      setMutedColor(calculateMutedColor(gradientColors, isDark));
      setCardBgColor(calculateCardBgColor(gradientColors, isDark));
    }
  }, [isDark, gradientColors]);

  // Convert rgb to rgba helper
  const rgbToRgba = (rgb: string, opacity: number) => {
    return rgb.replace("rgb(", "rgba(").replace(")", `, ${opacity})`);
  };

  if (isLoading || gradientColors.length === 0) {
    const loadingTextColor = calculateTextColor([], isDark);
    const loadingMutedColor = calculateMutedColor([], isDark);
    const loadingCardBgColor = calculateCardBgColor([], isDark);
    // Use fallback colors for dots while loading
    const fallbackDots = [
      "rgb(99, 102, 241)", // indigo-500
      "rgb(168, 85, 247)", // purple-500
      "rgb(236, 72, 153)", // pink-500
    ];
    return (
      <AlbumColorsContext.Provider
        value={{
          colors: [],
          textColor: loadingTextColor,
          mutedColor: loadingMutedColor,
          cardBgColor: loadingCardBgColor,
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
              filter: "blur(80px) brightness(0.6)",
              transform: "scale(1.2)", // Scale up to avoid blur edges
              opacity: isDark ? 0.5 : 0.4,
            }}
          />
        )}

        <div
          className={`fixed inset-0 z-[100] h-screen flex flex-col pt-20`}
          style={{ background: "transparent" }}
        >
          {/* Floating Background Shapes */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
            <div
              className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl"
              style={{
                backgroundColor: rgbToRgba(fallbackDots[0], 0.2),
                animation: "float-slow 30s ease-in-out infinite",
              }}
            />
            <div
              className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl"
              style={{
                backgroundColor: rgbToRgba(fallbackDots[1], 0.2),
                animation: "float 25s ease-in-out infinite",
              }}
            />
            <div
              className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl"
              style={{
                backgroundColor: rgbToRgba(fallbackDots[2], 0.2),
                animation: "glow-pulse 18s ease-in-out infinite",
              }}
            />
          </div>
          {children}
        </div>
      </AlbumColorsContext.Provider>
    );
  }

  // Create a beautiful, subtle gradient
  // Simple linear gradient that's elegant and works for both themes
  const createGradient = (colors: string[], isDarkMode: boolean) => {
    // Subtle opacity - lower for dark theme to avoid being too dark
    const baseOpacity = isDarkMode ? 0.2 : 0.25;

    // Simple, elegant linear gradient
    return `linear-gradient(to bottom, 
      ${rgbToRgba(colors[0], baseOpacity)} 0%,
      ${rgbToRgba(colors[1], baseOpacity * 0.9)} 50%,
      ${rgbToRgba(colors[2], baseOpacity * 0.7)} 100%
    )`;
  };

  const gradient = createGradient(gradientColors, isDark);

  return (
    <AlbumColorsContext.Provider
      value={{
        colors: gradientColors,
        textColor,
        mutedColor,
        cardBgColor,
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
            filter: "blur(80px) brightness(0.6)",
            transform: "scale(1.2)", // Scale up to avoid blur edges
            opacity: isDark ? 0.5 : 0.4,
          }}
        />
      )}

      <div
        className="fixed inset-0 z-[100] h-screen flex flex-col pt-20 transition-all duration-1000"
        style={{
          background: gradient,
        }}
      >
        {/* Floating Background Shapes - using contrasting album colors */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 1 }}>
          <div
            className="absolute top-20 left-10 w-64 h-64 rounded-full blur-3xl transition-all duration-1000"
            style={{
              backgroundColor: rgbToRgba(dotColors[0] || gradientColors[0], 0.2),
              animation: "float-slow 30s ease-in-out infinite",
            }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 rounded-full blur-3xl transition-all duration-1000"
            style={{
              backgroundColor: rgbToRgba(dotColors[1] || gradientColors[1], 0.2),
              animation: "float 25s ease-in-out infinite",
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full blur-3xl transition-all duration-1000"
            style={{
              backgroundColor: rgbToRgba(dotColors[2] || gradientColors[2], 0.2),
              animation: "glow-pulse 18s ease-in-out infinite",
            }}
          />
        </div>
        {children}
      </div>
    </AlbumColorsContext.Provider>
  );
}
