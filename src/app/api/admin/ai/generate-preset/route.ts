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
    const systemPrompt = `You are a world-class Art Director and Color Theorist specializing in high-end contemporary visual systems and gallery-grade palettes.

Your task is to generate a 3-color palette that feels curated, intentional, and visually structured, suitable for a premium digital product or art-forward brand.

The result must feel:
- Considered
- Editorial
- Physically grounded (pigments, materials, surfaces)
- Clearly art-directed, not generic or safe

---

STEP 1 — COLOR THEORY STRATEGY

**IMPORTANT: Randomly and EQUALLY select a base hue from the FULL color spectrum:**
- Warm hues: Red, Orange, Yellow, Warm Pink, Coral
- Cool hues: Blue, Cyan, Teal, Purple, Violet
- Earth tones: Brown, Olive, Sage, Terracotta, Rust
- Neutral tones: Slate, Steel, Taupe, Beige

Then randomly choose ONE strategy:

1. Monochromatic (with contrast)  
   One hue family with clear separation in lightness and saturation.

2. Analogous  
   Three neighboring hues with distinct roles.

3. Split-Complementary  
   One dominant hue with two complementary counterpoints.

4. Triadic (Artsy)  
   Three equidistant hues with distinct roles.

**CRITICAL: Truly randomize hue selection. Equal probability for warm, cool, earth, and neutral tones. Do not favor any color family.**

---

STEP 2 — COLOR RULES

Generate three colors in HEX format with strict roles:

PRIMARY COLOR  
- Emotional anchor of the palette  
- Must clearly read as a color, not a neutral  
- Moderate saturation (50-80%) with medium to high lightness  
- Can be ANY hue: warm (red, orange, yellow) OR cool (blue, cyan, purple, teal) OR earth (brown, olive, sage)  
- Feels like pigment, glaze, or material - explore all color families  

SECONDARY COLOR  
- Used for backgrounds or large surfaces  
- Medium-dark or dark, muted, breathable (darker than light, but brighter than very dark)  
- Must clearly contrast with the primary  
- Think medium charcoal, soft slate, muted earth, weathered stone (not super dark like pure charcoal or volcanic ash)  

ACCENT COLOR  
- Used sparingly for emphasis  
- Lighter or slightly contrasting  
- Must stand apart from primary or be analogous to primary  
- Moderate saturation (50-90%) - think refined pastels, soft highlights, gentle tones  

---

HARD CONSTRAINTS

- No pure greys as primary  
- No three colors in the same luminance range  
- Primary and secondary must be clearly distinguishable  
- Avoid default web colors  
- Primary and accent colors: saturation range 40–70%  
- Secondary color: muted/low saturation is acceptable, medium-dark lightness (not super dark, not bright)  
- Avoid neon or extremely high-chroma colors  
- **Vary hue selection across the full color spectrum - do not repeatedly use the same color families**  
- Palette must feel intentional, not algorithmic  

---

STEP 3 — NAME

Create a 2–3 word artistic name inspired by:
- Materials
- Geology
- Weathering
- Studios
- Natural processes

Examples (showing equal variety across color spectrum):
Oxidized Clay (warm earth)  
Sunbaked Studio (warm)  
Coral Dust (warm)  
Dust & Linen (neutral)  
Stone Atelier (neutral)  
Worn Mineral (earth)  
Sage Rust (earth)  
Deep Indigo (cool blue)  
Violet Mist (cool purple)  
Teal Depths (cool cyan)  

---

OUTPUT FORMAT (STRICT)

Return ONLY this JSON:

{
  "primary_color": "#RRGGBB",
  "secondary_color": "#RRGGBB",
  "accent_color": "#RRGGBB",
  "name": "Preset Name"
}

No markdown.  
No explanation.  
No extra text.
`;

    // Prepare request body
    const requestBody = {
      model: "openai/gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: "Generate a complete preset configuration. Randomly select from the full color spectrum with equal probability for warm, cool, earth, and neutral tones. Return only the JSON object.",
        },
      ],
      temperature: 1.3,
      max_tokens: 500,
      response_format: { type: "json_object" }, // Force JSON response
    };

    console.log("Sending request to OpenRouter with model:", requestBody.model);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    // Call OpenRouter API
    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://mihaipol.com",
        "X-Title": "Mihaipol.com",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("OpenRouter response status:", openRouterResponse.status, openRouterResponse.statusText);

    const responseText = await openRouterResponse.text();
    console.log("OpenRouter raw response:", responseText.substring(0, 1000)); // First 1000 chars

    if (!openRouterResponse.ok) {
      console.error("OpenRouter API error (status not ok):", responseText);
      return serverError(`Failed to generate preset: ${responseText}`, undefined);
    }

    let openRouterData;
    try {
      openRouterData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse OpenRouter response as JSON:", parseError);
      console.error("Response text:", responseText);
      return serverError("Invalid JSON response from OpenRouter", undefined);
    }
    
    // Check for errors in the response (even if status is 200)
    if (openRouterData.error) {
      console.error("OpenRouter API error in response:", openRouterData.error);
      return serverError(
        `OpenRouter error: ${openRouterData.error.message || JSON.stringify(openRouterData.error)}`,
        undefined
      );
    }
    
    // Log the full response for debugging
    console.log("OpenRouter response:", JSON.stringify(openRouterData, null, 2));
    
    if (!openRouterData.choices || openRouterData.choices.length === 0) {
      console.error("No choices in response. Full response:", JSON.stringify(openRouterData, null, 2));
      return serverError("No choices returned from AI model", undefined);
    }
    
    const responseContent = openRouterData.choices[0]?.message?.content?.trim();

    if (!responseContent) {
      console.error("No content in response. Full response:", JSON.stringify(openRouterData, null, 2));
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
