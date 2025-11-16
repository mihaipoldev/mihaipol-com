import { supabase } from '@/lib/supabase'

export async function createAlbum(albumData: {
  title: string
  slug: string
  catalog_number?: string | null
  album_type?: string | null
  description?: string | null
  cover_image_url?: string | null
  release_date?: string | null
  label_id?: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
}) {
  try {
    const { data, error } = await supabase
      .from('albums')
      .insert(albumData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating album:', error)
    throw error
  }
}

export async function updateAlbum(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('albums')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating album:', error)
    throw error
  }
}

export async function deleteAlbum(id: string) {
  try {
    const { error } = await supabase
      .from('albums')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting album:', error)
    throw error
  }
}

export async function createAlbumLink(linkData: {
  album_id: string
  platform_id?: string | null
  url: string
  cta_label: string
  link_type?: string | null
  sort_order?: number
}) {
  try {
    const { data, error } = await supabase
      .from('album_links')
      .insert(linkData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating album link:', error)
    throw error
  }
}

export async function updateAlbumLink(id: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from('album_links')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating album link:', error)
    throw error
  }
}

export async function deleteAlbumLink(id: string) {
  try {
    const { error } = await supabase
      .from('album_links')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting album link:', error)
    throw error
  }
}

