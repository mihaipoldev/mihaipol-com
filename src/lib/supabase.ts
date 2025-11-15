// SERVER ONLY - This module should only be imported in server-side code
// (Server Components, route handlers, server actions)

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// If you generate TypeScript types from your Supabase schema, uncomment and adjust:
// import type { Database } from '@/types/database'

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.')
  }

  // Create and export a single Supabase client instance for server-side use
  // If Database type exists, use: createClient<Database>(supabaseUrl, supabaseAnonKey)
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseInstance
}

// Create a proxy that lazily initializes the client only when accessed
// This prevents module evaluation errors during build time analysis
const supabaseProxy = new Proxy({} as SupabaseClient, {
  get(_target, prop, _receiver) {
    const client = getSupabaseClient()
    const value = (client as any)[prop]
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

export const supabase = supabaseProxy

