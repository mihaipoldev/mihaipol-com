// SERVER ONLY - This module should only be imported in server-side code
// (Server Components, route handlers, server actions)

import { createClient } from '@supabase/supabase-js'

// If you generate TypeScript types from your Supabase schema, uncomment and adjust:
// import type { Database } from '@/types/database'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY in .env.local')
}

// Create and export a single Supabase client instance for server-side use
// If Database type exists, use: createClient<Database>(supabaseUrl, supabaseAnonKey)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

