import { supabase } from '@/lib/supabase'

type FetchUpdatesOptions = {
  limit?: number
  order?: 'asc' | 'desc'
  includeUnpublished?: boolean
}

async function fetchUpdates(options: FetchUpdatesOptions = {}) {
  const {
    limit,
    order = 'desc',
    includeUnpublished = false,
  } = options

  try {
    let query = supabase.from('updates').select('*')

    // Filter by publish status
    if (!includeUnpublished) {
      query = query.eq('publish_status', 'published')
    }

    // Order by date
    query = query.order('date', { ascending: order === 'asc', nullsFirst: false })

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching updates:', error)
    return []
  }
}

export async function getHomepageUpdates(limit = 6) {
  return fetchUpdates({ limit, order: 'desc' })
}

export async function getAllUpdates() {
  return fetchUpdates({ order: 'desc' })
}

export async function getUpdateBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .eq('slug', slug)
      .eq('publish_status', 'published')
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching update by slug:', error)
    return null
  }
}

// Admin data fetching functions (returns all updates including unpublished)
export async function getAllUpdatesUnfiltered() {
  try {
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .order('date', { ascending: false, nullsFirst: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all updates:', error)
    return []
  }
}

export async function getUpdateById(id: string) {
  try {
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching update by id:', error)
    return null
  }
}

export async function getUpdateBySlugAdmin(slug: string) {
  try {
    const { data, error } = await supabase
      .from('updates')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching update by slug (admin):', error)
    return null
  }
}

