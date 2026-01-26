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
    
    console.log("[API] Received peaks update request:", {
      audioId: id,
      peaksType: typeof json.peaks,
      peaksIsArray: Array.isArray(json.peaks),
      peaksLength: json.peaks?.length || 0,
      peaksPreview: Array.isArray(json.peaks) ? json.peaks.slice(0, 5) : null,
    });
    
    const parsed = peaksSchema.safeParse(json);

    if (!parsed.success) {
      console.error("[API] Invalid peaks data:", parsed.error.flatten());
      return badRequest("Invalid peaks data", parsed.error.flatten());
    }

    console.log("[API] Updating album audio with peaks:", {
      audioId: id,
      peaksLength: parsed.data.peaks.length,
    });
    
    const result = await updateAlbumAudio(id, { waveform_peaks: parsed.data.peaks });
    
    console.log("[API] Successfully updated peaks:", {
      audioId: id,
      resultHasPeaks: !!result?.waveform_peaks,
      resultPeaksLength: result?.waveform_peaks?.length || 0,
    });
    
    return ok({ success: true });
  } catch (error: any) {
    console.error("[API] Error updating waveform peaks:", {
      error,
      errorMessage: error?.message,
      errorStack: error?.stack,
    });
    return serverError("Failed to update waveform peaks", error?.message);
  }
}
