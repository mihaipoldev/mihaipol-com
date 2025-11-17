import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// If you generate TypeScript types from your Supabase schema, uncomment and adjust:
// import type { Database } from '@/types/database'

let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const isServer = typeof window === "undefined";
  // Use server-only envs on the server; use NEXT_PUBLIC_* on the client
  const supabaseUrl = isServer ? process.env.SUPABASE_URL : process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = isServer
    ? process.env.SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const which = isServer
      ? "SUPABASE_URL and SUPABASE_ANON_KEY"
      : "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY";
    throw new Error(
      `Missing Supabase environment variables. Please check ${which} in your environment variables.`
    );
  }

  // Check for placeholder values
  if (
    supabaseUrl.includes("your-supabase-project-url") ||
    supabaseAnonKey.includes("your-supabase-anon-key")
  ) {
    const which = isServer
      ? "SUPABASE_URL and SUPABASE_ANON_KEY"
      : "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY";
    throw new Error(
      `Supabase environment variables contain placeholder values. Please update ${which} in your .env.local with actual values from your Supabase project settings.`
    );
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch {
    const which = isServer ? "SUPABASE_URL" : "NEXT_PUBLIC_SUPABASE_URL";
    throw new Error(
      `Invalid ${which} format: "${supabaseUrl}". It must be a valid HTTP or HTTPS URL (e.g., https://your-project.supabase.co).`
    );
  }

  // Create and export a single Supabase client instance for server-side use
  // If Database type exists, use: createClient<Database>(supabaseUrl, supabaseAnonKey)
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Create a proxy that lazily initializes the client only when accessed
// This prevents module evaluation errors during build time analysis
const supabaseProxy = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export const supabase = supabaseProxy;
