import { NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { unauthorized, forbidden } from "./api";
import { getSupabaseServer } from "@/lib/supabase-ssr";

export async function getCurrentUser() {
	const supabase = await getSupabaseServer();
	const { data } = await supabase.auth.getUser();
	return data.user ?? null;
}

export async function getCurrentUserRole(): Promise<"admin" | "user" | null> {
	const supabase = await getSupabaseServer();
	const user = await getCurrentUser();
	if (!user) return null;
	const { data, error } = await supabase
		.from("user_settings")
		.select("role")
		.eq("user_id", user.id)
		.maybeSingle();
	if (error) return null;
	return (data?.role as "admin" | "user" | undefined) ?? null;
}

// Redirect-style guard for server components (layouts/pages)
export async function requireUserRedirect() {
	const user = await getCurrentUser();
	if (!user) redirect("/admin/login");
	return user;
}

// API-style guard: returns a Response for 401/403 or {ok:true} when allowed
export async function requireAdmin(request: NextRequest) {
	try {
		const supabase = await getSupabaseServer();

		// Attempt to read current user via SSR cookies
		const { data: { user } } = await supabase.auth.getUser();
		if (!user) {
			return unauthorized();
		}

		// Check role in user_settings
		const { data } = await supabase
			.from("user_settings")
			.select("role")
			.eq("user_id", user.id)
			.maybeSingle();

		if (!data || data.role !== "admin") {
			return forbidden();
		}

		return { ok: true as const };
	} catch {
		return unauthorized();
	}
}

