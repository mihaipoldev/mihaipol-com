import { NextRequest } from "next/server";
import { ok, unauthorized } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { getOAuthToken } from "@/features/google-drive/data";

export async function GET(request: NextRequest) {
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

    const token = await getOAuthToken(user.id);

    return ok({
      authenticated: !!token,
    });
  } catch (error: any) {
    console.error("Error checking Google Drive status:", error);
    return ok({
      authenticated: false,
    });
  }
}
