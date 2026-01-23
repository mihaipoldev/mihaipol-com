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
    const systemPrompt = `You are a world-class Art Director and Color Theorist for a high-end contemporary art portfolio. Your task is to generate a sophisticated, minimal, and "gallery-quality" 3-color preset.

The aesthetic must be ARTSY, REFINED, and INTENTIONAL. Avoid "default web colors" or overly vibrant "tech startup" palettes. Think in terms of physical pigments, Pantone swatches, oil paints, and natural materials (clay, stone, foliage, pigment).

STEP 1: CHOOSE A COLOR THEORY STRATEGY (Select one randomly):
1. Monochromatic: Variations of lightness/saturation of a single sophisticated hue (e.g., different shades of slate blue or olive).
2. Analogous: Three colors that sit next to each other on the wheel (e.g., Terracotta, Rust, and Deep Ochre).
3. Split-Complementary (Muted): One base color and two adjacent to its opposite, but DESATURATED (e.g., Sage Green with Muted Coral and Dusty Pink).
4. Triadic (Artsy): Three equidistant colors, but with lowered saturation to avoid a "circus" look (e.g., Mustard, Teal, and Burgundy).

STEP 2: GENERATE THE COLORS (Hex format #RRGGBB):
- Colors should generally be "Off-Colors" rather than pure primaries.
- PREFERRED TONES: Ochre, Terracotta, Sage, Slate, Charcoal, Cream, Olive, Teal, Burgundy, Sand, Concrete, Midnight.
- SATURATION: Keep saturation generally between 10-70%. Avoid neon (100% saturation) unless used as a tiny micro-accent against neutrals.
- LIGHTNESS: Ensure there is contrast, but it can be subtle (e.g., dark grey vs black).

PRIMARY COLOR: The dominant mood setter. It should feel like a Pantone swatch.
SECONDARY COLOR: Supports the primary based on the chosen theory strategy.
ACCENT COLOR: A detail color. In minimal designs, this might be a subtle variation or a sharp but sophisticated contrast.

STEP 3: NAME THE PRESET:
Create an abstract, artistic name (2-3 words). Avoid generic tech names.
Examples: "Oxidized Copper", "Concrete Flora", "Midnight Clay", "Bauhaus Primary", "Wabi Sabi", "Dusty Atelier".

CRITICAL OUTPUT RULES:
- You MUST return ONLY a valid JSON object.
- No markdown formatting, no explanations.

JSON STRUCTURE:
{
  "primary_color": "#RRGGBB",
  "secondary_color": "#RRGGBB",
  "accent_color": "#RRGGBB",
  "name": "Preset Name"
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
