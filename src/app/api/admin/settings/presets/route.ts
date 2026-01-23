import { NextRequest } from "next/server";
import type { LandingPagePreset } from "@/lib/landing-page-presets";
import {
  readCustomPresets,
  writeCustomPresets,
  getNextCustomPresetId,
} from "@/lib/landing-page-presets-server";
import { ok, badRequest, serverError, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const presetSchema = z.object({
  name: z.string().min(1).max(100),
  primary: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Invalid HSL format (expected: 'h s% l%')"),
  secondary: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Invalid HSL format (expected: 'h s% l%')"),
  accent: z.string().regex(/^\d+\s+\d+%\s+\d+%$/, "Invalid HSL format (expected: 'h s% l%')"),
});

const updatePresetSchema = presetSchema.extend({
  id: z.number().int().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const presets = readCustomPresets();
    return ok(presets);
  } catch (error: any) {
    console.error("Error fetching presets:", error);
    return serverError("Failed to fetch presets", error?.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    const parsed = presetSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid preset data", parsed.error.flatten());
    }

    const presets = readCustomPresets();
    const newId = getNextCustomPresetId(presets);

    const newPreset: LandingPagePreset = {
      id: newId,
      name: parsed.data.name,
      primary: parsed.data.primary,
      secondary: parsed.data.secondary,
      accent: parsed.data.accent,
    };

    presets.push(newPreset);
    writeCustomPresets(presets);

    return ok(newPreset);
  } catch (error: any) {
    console.error("Error creating preset:", error);
    return serverError("Failed to create preset", error?.message);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const json = await request.json();
    const parsed = updatePresetSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid preset data", parsed.error.flatten());
    }

    const presets = readCustomPresets();
    const index = presets.findIndex((p) => p.id === parsed.data.id);

    if (index === -1) {
      return badRequest("Preset not found", {});
    }

    presets[index] = {
      id: parsed.data.id,
      name: parsed.data.name,
      primary: parsed.data.primary,
      secondary: parsed.data.secondary,
      accent: parsed.data.accent,
    };

    writeCustomPresets(presets);

    return ok(presets[index]);
  } catch (error: any) {
    console.error("Error updating preset:", error);
    return serverError("Failed to update preset", error?.message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return badRequest("Preset ID is required", {});
    }

    const presetId = parseInt(id, 10);
    if (isNaN(presetId) || presetId < 1) {
      return badRequest("Invalid preset ID", {});
    }

    const presets = readCustomPresets();
    const filtered = presets.filter((p) => p.id !== presetId);

    if (filtered.length === presets.length) {
      return badRequest("Preset not found", {});
    }

    writeCustomPresets(filtered);

    return ok({ success: true, deletedId: presetId });
  } catch (error: any) {
    console.error("Error deleting preset:", error);
    return serverError("Failed to delete preset", error?.message);
  }
}
