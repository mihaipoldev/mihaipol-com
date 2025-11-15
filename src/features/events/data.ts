import { supabase } from '@/lib/supabase'

type FetchEventsOptions = {
  status?: 'upcoming' | 'past' | 'all'
  limit?: number
  order?: 'asc' | 'desc'
  includeUnpublished?: boolean
}

async function fetchEvents(options: FetchEventsOptions = {}) {
  const {
    status = 'all',
    limit,
    order = 'asc',
    includeUnpublished = false,
  } = options

  try {
    let query = supabase.from('events').select('*')

    // Filter by publish status
    if (!includeUnpublished) {
      query = query.eq('publish_status', 'published')
    }

    // Filter by event status and date
    if (status === 'upcoming') {
      query = query
        .eq('event_status', 'upcoming')
        .gte('starts_at', new Date().toISOString())
    } else if (status === 'past') {
      query = query.or('event_status.eq.past,starts_at.lt.' + new Date().toISOString())
    }

    // Order by starts_at
    query = query.order('starts_at', { ascending: order === 'asc' })

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export async function getHomepageEvents(limit = 6) {
  // Original behavior: fetch all published events ordered by starts_at ascending
  // This shows upcoming events first naturally due to ordering
  return fetchEvents({ status: 'all', limit, order: 'asc' })
}

export async function getEventBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .eq('publish_status', 'published')
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}

