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
    // 🐛 DEBUG: Start timing
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    // Select only needed columns
    let query = supabase
      .from('updates')
      .select('id, title, slug, date, publish_status, image_url')

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

    // 🐛 DEBUG: Log query time
    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    const dataCount = data?.length || 0
    console.log(`🔍 [DB] updates query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`)

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: updates fetch took ${queryTime.toFixed(0)}ms`)
    }

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
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('updates')
      .select('id, title, slug, date, publish_status, image_url')
      .eq('slug', slug)
      .eq('publish_status', 'published')
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] update by slug query completed in ${queryTime.toFixed(0)}ms`)

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
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('updates')
      .select('id, title, slug, subtitle, date, publish_status, image_url')
      .order('date', { ascending: false, nullsFirst: false })

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    const dataCount = data?.length || 0
    console.log(`🔍 [DB] all updates (unfiltered) query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`)

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: all updates (unfiltered) took ${queryTime.toFixed(0)}ms`)
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all updates:', error)
    return []
  }
}

export async function getUpdateById(id: string) {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('updates')
      .select('id, title, slug, date, publish_status, image_url')
      .eq('id', id)
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] update by id query completed in ${queryTime.toFixed(0)}ms`)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching update by id:', error)
    return null
  }
}

export async function getUpdateBySlugAdmin(slug: string) {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('updates')
      .select('id, title, slug, subtitle, date, publish_status, image_url, description, read_more_url')
      .eq('slug', slug)
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] update by slug (admin) query completed in ${queryTime.toFixed(0)}ms`)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching update by slug (admin):', error)
    return null
  }
}

