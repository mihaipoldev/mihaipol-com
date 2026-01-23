import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api";
import { getSupabaseServer } from "@/lib/supabase-ssr";
import { storeOAuthToken } from "@/features/google-drive/mutations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect(new URL("/admin/albums?error=oauth_cancelled", request.url));
    }

    if (!code || !state) {
      return badRequest("Missing code or state parameter");
    }

    // Decode state to get userId
    let userId: string;
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
      userId = stateData.userId;
    } catch {
      return badRequest("Invalid state parameter");
    }

    // Verify user is authenticated
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== userId) {
      return badRequest("User authentication failed");
    }

    // Exchange code for tokens
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      return serverError("Google OAuth not configured");
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      return serverError("Failed to exchange authorization code for tokens");
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token || !tokenData.refresh_token || !tokenData.expires_in) {
      return serverError("Invalid token response from Google");
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Store tokens in database
    await storeOAuthToken(userId, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
    });

    return NextResponse.redirect(new URL("/admin/settings?tab=integrations&success=google_drive_connected", request.url));
  } catch (error: any) {
    console.error("Error handling OAuth callback:", error);
    return serverError("Failed to complete OAuth flow", error?.message);
  }
}
