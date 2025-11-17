import { getAllArtists } from "@/features/artists/data"
import { ArtistsList } from "@/features/artists/components/ArtistsList"

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  const artists = await getAllArtists()
  
  return <ArtistsList initialArtists={artists} />
}

