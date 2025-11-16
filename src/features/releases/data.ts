import { supabase } from '@/lib/supabase'

// TODO: Create releases table in database
// For now, this is a placeholder structure
export async function getAllReleases() {
  try {
    // Placeholder - will be implemented when releases table is created
    // const { data, error } = await supabase
    //   .from('releases')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    // if (error) throw error
    // return data || []
    return []
  } catch (error) {
    console.error('Error fetching all releases:', error)
    return []
  }
}

export async function getReleaseById(id: string) {
  try {
    // Placeholder - will be implemented when releases table is created
    // const { data, error } = await supabase
    //   .from('releases')
    //   .select('*')
    //   .eq('id', id)
    //   .single()

    // if (error) throw error
    // return data || null
    return null
  } catch (error) {
    console.error('Error fetching release by id:', error)
    return null
  }
}

