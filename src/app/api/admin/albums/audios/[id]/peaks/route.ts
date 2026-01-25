import { NextRequest, NextResponse } from "next/server";
import { updateAlbumAudio } from "@/features/albums/mutations";
import { ok, badRequest, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const peaksSchema = z.object({
  peaks: z.array(z.number()),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in (guard as any)) return guard as any;

    const { id } = await params;
    const json = await request.json();
    const parsed = peaksSchema.safeParse(json);

    if (!parsed.success) {
      return badRequest("Invalid peaks data", parsed.error.flatten());
    }

    await updateAlbumAudio(id, { waveform_peaks: parsed.data.peaks });
    return ok({ success: true });
  } catch (error: any) {
    console.error("Error updating waveform peaks:", error);
    return serverError("Failed to update waveform peaks", error?.message);
  }
}
