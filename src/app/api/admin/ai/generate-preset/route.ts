import { NextRequest } from "next/server";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { hexToHsl } from "@/lib/colorUtils";

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    // Check if OPENROUTER_KEY is configured
    const openRouterKey = process.env.OPENROUTER_KEY;
    if (!openRouterKey) {
      return serverError("OpenRouter API key not configured", undefined);
    }

    // Build comprehensive system prompt for color generation
    const systemPrompt = `You are an expert color designer creating professional, modern website presets. Your task is to generate complete preset configurations with three harmonious colors that are thoughtful, sophisticated, and visually compelling. Be CREATIVE and VARIED - create a diverse range of presets, from vibrant and energetic to calm and minimal.

COLOR REQUIREMENTS - BE CREATIVE, VARIED, AND THOUGHTFUL:
Think deeply about color psychology and create presets with personality. Vary your approach:
- VIBRANT PRESETS: Bold, energetic colors that convey innovation and energy. Think electric violets (#7C3AED, #9333EA), vibrant cyans (#0891B2, #0D9488), rich emeralds (#10B981, #059669), or bold corals (#F97316, #EA580C). High saturation (60-90%), medium to high lightness.
- CALM/CHILL PRESETS: Softer, more muted colors that convey tranquility and sophistication. Think sage greens (#65A30D, #84CC16), dusty roses (#BE185D, #DB2777), muted teals (#14B8A6, #0D9488), or warm grays with subtle color (#78716C, #57534E). Medium saturation (40-60%), varied lightness.
- SOPHISTICATED PRESETS: Deep, rich colors that convey luxury and professionalism. Think deep indigos (#4F46E5, #6366F1), burgundy reds (#991B1B, #B91C1C), forest greens (#065F46, #047857), or charcoal with accent colors. Medium to high saturation (50-80%), lower lightness (20-50%).

PRIMARY COLOR: Generate a UNIQUE hex color (format: #RRGGBB) that stands out. AVOID generic web colors like #007bff, #28a745, #ffc107, #dc3545. Instead, be creative:
  * Nature-inspired: sunset oranges, forest emeralds, ocean teals, lavender purples, sage greens, desert sands
  * Modern bold: electric violets, amber golds, deep roses, vibrant cyans, mint greens
  * Sophisticated: deep magentas, rich burgundies, charcoal blues, warm terracottas
  * The color should have CHARACTER and PERSONALITY. Think of premium brands, art galleries, high-end design studios, or unique natural phenomena.
  * Vary saturation (30-90%) and lightness (20-80%) based on the preset style you're creating.

SECONDARY COLOR: Generate a COMPLEMENTARY hex color (format: #RRGGBB) that creates beautiful harmony. Be thoughtful:
  * Use color theory: complementary (opposite), analogous (adjacent), triadic, or split-complementary schemes
  * For vibrant presets: create exciting contrast - warm with cool, bright with deep
  * For calm presets: use harmonious, analogous colors or soft complements
  * For sophisticated presets: use deep, rich complements or elegant monochromatic variations
  * Consider unexpected but beautiful pairings: deep purple with golden yellow, teal with coral, emerald with rose, sage with terracotta

ACCENT COLOR: Generate a THIRD hex color (format: #RRGGBB) that adds depth and visual interest. This should:
  * Work beautifully with both primary and secondary colors
  * Create a cohesive three-color palette
  * Use color theory to ensure all three colors work together (triadic, split-complementary, or analogous schemes work well)
  * Should be distinct enough to create clear visual hierarchy
  * The combination of all three colors should feel intentional, sophisticated, and modern

NAME GENERATION:
Generate a creative, professional preset name (2-4 words) that captures the essence of the color scheme and overall aesthetic. Be thoughtful and varied:
- For vibrant presets: "Electric Dreams", "Bold Horizon", "Vibrant Pulse", "Energy Wave"
- For calm presets: "Serene Mist", "Gentle Breeze", "Quiet Elegance", "Soft Horizon"
- For sophisticated presets: "Midnight Elegance", "Royal Depth", "Luxury Noir", "Refined Classic"
- For modern/tech presets: "Future Forward", "Digital Edge", "Tech Modern", "Urban Pulse"
Make it memorable, catchy, and business-appropriate. Avoid generic names.

CRITICAL: You MUST return ONLY a valid JSON object with this EXACT structure. No markdown, no code blocks, no explanations - just the JSON:
{
  "primary_color": "#RRGGBB",
  "secondary_color": "#RRGGBB",
  "accent_color": "#RRGGBB",
  "name": "Preset Name Here"
}`;

    // Call OpenRouter API
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mihaipol.com",
        "X-Title": "Mihaipol.com",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: "Generate a complete preset configuration now. Return only the JSON object.",
          },
        ],
        temperature: 1.3, // Higher temperature for more creative, varied, and thoughtful choices
        max_tokens: 500,
        response_format: { type: "json_object" }, // Force JSON response
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error("OpenRouter API error:", errorData);
      return serverError("Failed to generate preset", undefined);
    }

    const openRouterData = await openRouterResponse.json();
    const responseContent = openRouterData.choices?.[0]?.message?.content?.trim();

    if (!responseContent) {
      return serverError("No preset generated from AI", undefined);
    }

    // Parse JSON response
    let presetData;
    try {
      // Remove markdown code blocks if present
      const cleanedContent = responseContent
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      presetData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError, responseContent);
      return serverError("Invalid JSON response from AI", undefined);
    }

    // Validate required fields
    if (
      !presetData.primary_color ||
      !presetData.secondary_color ||
      !presetData.accent_color
    ) {
      return serverError("Missing required color fields", undefined);
    }

    // Validate and normalize hex colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    // Normalize 3-character hex to 6-character
    const normalizeHex = (hex: string): string => {
      if (hex.length === 4) {
        // #RGB format
        return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
      }
      return hex;
    };

    if (
      !hexColorRegex.test(presetData.primary_color) ||
      !hexColorRegex.test(presetData.secondary_color) ||
      !hexColorRegex.test(presetData.accent_color)
    ) {
      return serverError("Invalid color format", undefined);
    }

    // Normalize hex colors to 6-character format
    presetData.primary_color = normalizeHex(presetData.primary_color);
    presetData.secondary_color = normalizeHex(presetData.secondary_color);
    presetData.accent_color = normalizeHex(presetData.accent_color);

    // Convert hex colors to HSL format
    const primaryHsl = hexToHsl(presetData.primary_color);
    const secondaryHsl = hexToHsl(presetData.secondary_color);
    const accentHsl = hexToHsl(presetData.accent_color);

    if (!primaryHsl || !secondaryHsl || !accentHsl) {
      return serverError("Failed to convert colors to HSL", undefined);
    }

    // Format HSL as "h s% l%" strings
    const primaryHslString = `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`;
    const secondaryHslString = `${secondaryHsl.h} ${secondaryHsl.s}% ${secondaryHsl.l}%`;
    const accentHslString = `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`;

    // Validate and clean name
    if (!presetData.name || typeof presetData.name !== "string") {
      presetData.name = "AI Generated Preset";
    }
    presetData.name = presetData.name
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .trim()
      .slice(0, 100); // Limit length

    // Return preset data in the format expected by the frontend
    return ok({
      name: presetData.name,
      primary: primaryHslString,
      secondary: secondaryHslString,
      accent: accentHslString,
    });
  } catch (error) {
    console.error("Error generating preset:", error);
    return serverError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      undefined
    );
  }
}
