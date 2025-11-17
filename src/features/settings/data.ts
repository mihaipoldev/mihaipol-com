import { supabase } from '@/lib/supabase'
import type { UserSettings, UserColor } from './types'

/**
 * Fetch user settings record
 */
export async function fetchUserSettings(userId: string): Promise<UserSettings | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user settings:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return null
  }
}

/**
 * Fetch style_color specifically
 */
export async function fetchStyleColor(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('style_color')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching style color:', error)
      return null
    }

    return data?.style_color || null
  } catch (error) {
    console.error('Error fetching style color:', error)
    return null
  }
}

/**
 * Fetch all user colors
 */
export async function fetchUserColors(userId: string): Promise<UserColor[]> {
  try {
    const { data, error } = await supabase
      .from('user_colors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching user colors:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching user colors:', error)
    return []
  }
}

/**
 * Fetch a single user color by ID
 */
export async function fetchUserColor(userId: string, colorId: string): Promise<UserColor | null> {
  try {
    const { data, error } = await supabase
      .from('user_colors')
      .select('*')
      .eq('user_id', userId)
      .eq('id', colorId)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Color not found
      }
      console.error('Error fetching user color:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching user color:', error)
    return null
  }
}

