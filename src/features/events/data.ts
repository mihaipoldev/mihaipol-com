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
    // 🐛 DEBUG: Start timing
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    // Select only needed columns
    let query = supabase
      .from('events')
      .select('id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description')

    // Filter by publish status
    if (!includeUnpublished) {
      query = query.eq('publish_status', 'published')
    }

    // Filter by event status and date
    if (status === 'upcoming') {
      query = query
        .eq('event_status', 'upcoming')
        .gte('date', new Date().toISOString().split('T')[0])
    } else if (status === 'past') {
      const today = new Date().toISOString().split('T')[0]
      query = query.or(`event_status.eq.past,date.lt.${today}`)
    }

    // Order by date
    query = query.order('date', { ascending: order === 'asc' })

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    // 🐛 DEBUG: Log query time
    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    const dataCount = data?.length || 0
    console.log(`🔍 [DB] events query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`)

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: events fetch took ${queryTime.toFixed(0)}ms`)
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export async function getHomepageEvents(limit = 6) {
  // Original behavior: fetch all published events ordered by date ascending
  // This shows upcoming events first naturally due to ordering
  return fetchEvents({ status: 'all', limit, order: 'asc' })
}

export async function getAllEvents() {
  return fetchEvents({ status: 'all', order: 'asc' })
}

export async function getEventBySlug(slug: string) {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url')
      .eq('slug', slug)
      .eq('publish_status', 'published')
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] event by slug query completed in ${queryTime.toFixed(0)}ms`)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching event by slug:', error)
    return null
  }
}

// Admin data fetching functions (returns all events including unpublished)
export async function getAllEventsUnfiltered() {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url')
      .order('date', { ascending: false })

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    const dataCount = data?.length || 0
    console.log(`🔍 [DB] all events (unfiltered) query completed in ${queryTime.toFixed(0)}ms → ${dataCount} records`)

    if (queryTime > 1000) {
      console.warn(`⚠️ [DB] SLOW QUERY: all events (unfiltered) took ${queryTime.toFixed(0)}ms`)
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all events:', error)
    return []
  }
}

export async function getEventById(id: string) {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url')
      .eq('id', id)
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] event by id query completed in ${queryTime.toFixed(0)}ms`)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching event by id:', error)
    return null
  }
}

export async function getEventBySlugAdmin(slug: string) {
  try {
    const queryStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now()

    const { data, error } = await supabase
      .from('events')
      .select('id, title, slug, date, venue, city, country, event_status, publish_status, flyer_image_url, description, ticket_label, tickets_url')
      .eq('slug', slug)
      .single()

    const queryTime = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - queryStartTime
    console.log(`🔍 [DB] event by slug (admin) query completed in ${queryTime.toFixed(0)}ms`)

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching event by slug (admin):', error)
    return null
  }
}

