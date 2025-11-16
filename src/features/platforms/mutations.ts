import { supabase } from '@/lib/supabase'

export async function createPlatform(platformData: {
  name: string
  slug: string
  display_name: string
  base_url?: string | null
  icon_url?: string | null
  is_active: boolean
  sort_order: number
}) {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .insert(platformData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating platform:', error)
    throw error
  }
}

export async function updatePlatform(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating platform:', error)
    throw error
  }
}

export async function deletePlatform(id: string) {
  try {
    const { error } = await supabase
      .from('platforms')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting platform:', error)
    throw error
  }
}

