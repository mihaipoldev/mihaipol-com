import { NextRequest } from "next/server";
import { ok, serverError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set() {},
          remove() {},
        },
      }
    );

    const { data: devPreset, error: devError } = await supabase
      .from("site_preferences")
      .select("value")
      .eq("key", "landing_page_preset_number")
      .maybeSingle();

    const { data: prodPreset, error: prodError } = await supabase
      .from("site_preferences")
      .select("value")
      .eq("key", "landing_page_preset_prod")
      .maybeSingle();

    return ok({
      dev: {
        value: devPreset?.value,
        error: devError,
        type: typeof devPreset?.value,
        isObject: typeof devPreset?.value === "object" && devPreset?.value !== null,
        hasId: devPreset?.value && typeof devPreset.value === "object" && "id" in devPreset.value,
      },
      prod: {
        value: prodPreset?.value,
        error: prodError,
        type: typeof prodPreset?.value,
        isObject: typeof prodPreset?.value === "object" && prodPreset?.value !== null,
        hasId: prodPreset?.value && typeof prodPreset.value === "object" && "id" in prodPreset.value,
      },
    });
  } catch (error: any) {
    return serverError("Failed to debug preset", error?.message);
  }
}
