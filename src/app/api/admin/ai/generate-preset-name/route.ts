import { NextRequest } from "next/server";
import { ok, badRequest, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

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

    // Parse request body
    const body = await request.json();
    const { primary_color, secondary_color, accent_color } = body;

    if (!primary_color || !secondary_color || !accent_color) {
      return badRequest("primary_color, secondary_color, and accent_color are required");
    }

    // Build system prompt focused on color harmony and aesthetic
    const systemPrompt = `Generate a creative and descriptive name (2-4 words) for a website preset with these color characteristics:
- Primary color: ${primary_color}
- Secondary color: ${secondary_color}
- Accent color: ${accent_color}

The name should be catchy, professional, and reflect the visual style and color harmony. Consider the color relationships (complementary, analogous, triadic, etc.) and the overall mood they create. Return only the name, no quotes or additional text.`;

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
        model: "openai/gpt-4o-mini", // Using a cost-effective model
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: "Generate the preset name now.",
          },
        ],
        temperature: 0.8, // Slightly creative but not too random
        max_tokens: 20, // Short names only
      }),
    });

    if (!openRouterResponse.ok) {
      const errorData = await openRouterResponse.text();
      console.error("OpenRouter API error:", errorData);
      return serverError("Failed to generate preset name", undefined);
    }

    const openRouterData = await openRouterResponse.json();
    const generatedName = openRouterData.choices?.[0]?.message?.content?.trim();

    if (!generatedName) {
      return serverError("No name generated from AI", undefined);
    }

    // Clean up the name - remove quotes and extra whitespace
    const cleanName = generatedName
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .trim()
      .slice(0, 100); // Limit length

    if (!cleanName) {
      return serverError("Generated name is empty", undefined);
    }

    return ok({ name: cleanName });
  } catch (error) {
    console.error("Error generating preset name:", error);
    return serverError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      undefined
    );
  }
}
