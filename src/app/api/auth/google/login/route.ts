import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { unauthorized, serverError } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase-ssr";

export async function GET(request: NextRequest) {
  try {
    const guard = await requireAdmin(request);
    if ("status" in guard) return guard;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId) {
      return serverError("Google OAuth not configured. Please set GOOGLE_CLIENT_ID in your environment variables.");
    }

    // Get current user ID
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return unauthorized();
    }

    // Generate state token for CSRF protection
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString("base64url");

    // Build OAuth URL
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error("Error initiating Google OAuth:", error);
    return serverError("Failed to initiate OAuth flow", error?.message);
  }
}
