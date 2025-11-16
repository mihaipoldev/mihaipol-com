import { supabase } from '@/lib/supabase'

export async function createUpdate(updateData: {
  title: string
  slug: string
  subtitle?: string | null
  description?: string | null
  image_url?: string | null
  date?: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
  read_more_url?: string | null
}) {
  try {
    const { data, error } = await supabase
      .from('updates')
      .insert(updateData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating update:', error)
    throw error
  }
}

export async function updateUpdate(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('updates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating update:', error)
    throw error
  }
}

export async function deleteUpdate(id: string) {
  try {
    const { error } = await supabase
      .from('updates')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting update:', error)
    throw error
  }
}

