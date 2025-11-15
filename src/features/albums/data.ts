import { supabase } from '@/lib/supabase'

type FetchAlbumsOptions = {
  limit?: number
  order?: 'asc' | 'desc'
  includeUnpublished?: boolean
  includeLabels?: boolean
}

type AlbumWithLabel = {
  labelName: string | null
  [key: string]: any
}

async function fetchAlbums(options: FetchAlbumsOptions = {}) {
  const {
    limit,
    order = 'desc',
    includeUnpublished = false,
    includeLabels = false,
  } = options

  try {
    let query = supabase
      .from('albums')
      .select('*')

    // Filter by publish status
    if (!includeUnpublished) {
      query = query.eq('publish_status', 'published')
    }

    // Order by release_date
    query = query.order('release_date', { ascending: order === 'asc', nullsFirst: false })

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const { data: albums, error } = await query

    if (error) throw error

    // If labels are requested, fetch and join them
    if (includeLabels && albums && albums.length > 0) {
      const labelIds = albums.filter((a) => a.label_id).map((a) => a.label_id)
      
      if (labelIds.length > 0) {
        const { data: labels } = await supabase
          .from('labels')
          .select('id, name')
          .in('id', labelIds)

        // Map labels to albums
        const labelsMap = new Map(labels?.map((l) => [l.id, l.name]) || [])
        const albumsWithLabels: AlbumWithLabel[] = albums.map((album) => ({
          ...album,
          labelName: album.label_id ? labelsMap.get(album.label_id) || null : null,
        }))

        return albumsWithLabels
      }

      // No label_ids, but still return with labelName: null
      return albums.map((album) => ({
        ...album,
        labelName: null,
      }))
    }

    return albums || []
  } catch (error) {
    console.error('Error fetching albums:', error)
    return []
  }
}

export async function getHomepageAlbums(limit = 6) {
  return fetchAlbums({ limit, order: 'desc', includeLabels: true })
}

export async function getAllAlbums() {
  return fetchAlbums({ order: 'desc', includeLabels: true })
}

export async function getAlbumBySlug(slug: string) {
  try {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('slug', slug)
      .eq('publish_status', 'published')
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching album by slug:', error)
    return null
  }
}

export async function getAlbumWithLinksBySlug(slug: string) {
  try {
    // Fetch album
    const album = await getAlbumBySlug(slug)
    if (!album) return null

    // Fetch all artists for this album via album_artists join table
    let artistName: string | null = null
    try {
      const { data: albumArtistsData, error: albumArtistsError } = await supabase
        .from('album_artists')
        .select(`
          artist_id,
          sort_order,
          artists (
            name
          )
        `)
        .eq('album_id', album.id)
        .order('sort_order', { ascending: true })

      if (!albumArtistsError && albumArtistsData && albumArtistsData.length > 0) {
        // Extract artist names and combine them
        const artistNames = albumArtistsData
          .map((aa: any) => aa.artists?.name)
          .filter((name: string | null) => name !== null && name !== undefined)
        
        if (artistNames.length > 0) {
          artistName = artistNames.join(', ')
        }
      }
    } catch (e) {
      console.log('Error fetching album artists:', e)
    }

    // Fetch album_links with platform information
    let links: any[] = []
    try {
      const { data: linksData, error: linksError } = await supabase
        .from('album_links')
        .select(`
          id,
          url,
          cta_label,
          sort_order,
          platforms (
            name,
            display_name,
            icon_url
          )
        `)
        .eq('album_id', album.id)
        .order('sort_order', { ascending: true })

      if (!linksError && linksData) {
        links = linksData.map((link: any) => ({
          platformName: link.platforms?.display_name || link.platforms?.name || '',
          platformIconUrl: link.platforms?.icon_url || null,
          ctaLabel: link.cta_label || 'Play',
          url: link.url || '',
        }))
      }
    } catch (e) {
      console.log('Error fetching album links:', e)
    }

    return {
      album: {
        id: album.id,
        title: album.title,
        slug: album.slug,
        catalog_number: album.catalog_number || album.catalogNumber || null,
        coverImageUrl: album.cover_image_url || album.coverImageUrl || null,
        releaseDate: album.release_date || album.releaseDate || null,
        artistName,
      },
      links,
    }
  } catch (error) {
    console.error('Error fetching album with links by slug:', error)
    return null
  }
}

