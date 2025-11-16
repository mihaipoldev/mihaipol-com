import { supabase } from '@/lib/supabase'

export async function getAllPlatforms() {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all platforms:', error)
    return []
  }
}

export async function getPlatformById(id: string) {
  try {
    const { data, error } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data || null
  } catch (error) {
    console.error('Error fetching platform by id:', error)
    return null
  }
}

export async function getPlatformBySlug(slug: string) {
  try {
    // First try to find by slug
    const { data: slugData, error: slugError } = await supabase
      .from('platforms')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!slugError && slugData) {
      return slugData
    }

    // If not found by slug, try to find by name (for platforms without slugs)
    // Generate slug from name and compare
    const { data: allPlatforms, error: allError } = await supabase
      .from('platforms')
      .select('*')

    if (allError) throw allError

    // Find platform where generated slug matches
    const platform = allPlatforms?.find((p) => {
      const generatedSlug = (p.name || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      return generatedSlug === slug
    })

    return platform || null
  } catch (error) {
    console.error('Error fetching platform by slug:', error)
    return null
  }
}

