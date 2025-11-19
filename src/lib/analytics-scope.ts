import { cookies } from "next/headers";

const SCOPE_COOKIE_NAME = "admin-analytics-scope";

export type TimeScope = "7" | "30" | "90" | "365" | "all";

/**
 * Get the analytics scope from URL params or cookies.
 * URL params take precedence over cookies.
 * Defaults to "30" if neither is available.
 */
export async function getAnalyticsScope(urlScope?: string | null): Promise<TimeScope> {
  // URL param takes precedence
  if (urlScope && ["7", "30", "90", "365", "all"].includes(urlScope)) {
    return urlScope as TimeScope;
  }

  // Fall back to cookie
  const cookieStore = await cookies();
  const cookieScope = cookieStore.get(SCOPE_COOKIE_NAME)?.value;
  if (cookieScope && ["7", "30", "90", "365", "all"].includes(cookieScope)) {
    return cookieScope as TimeScope;
  }

  // Default to "30"
  return "30";
}
