import { NextRequest } from "next/server";
import { ok, unauthorized, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { deleteOAuthToken } from "@/features/google-drive/mutations";

export async function DELETE(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    await deleteOAuthToken(user.id);

    return ok({
      success: true,
      message: "Google Drive disconnected successfully",
    });
  } catch (error: any) {
    console.error("Error disconnecting Google Drive:", error);
    return serverError("Failed to disconnect Google Drive", error?.message);
  }
}
