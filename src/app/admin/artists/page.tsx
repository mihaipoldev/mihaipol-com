import { getAllArtists } from "@/features/artists/data"
import { ArtistsClient } from "./ArtistsClient"

export const dynamic = 'force-dynamic'

export default async function ArtistsPage() {
  const artists = await getAllArtists()
  
  return <ArtistsClient initialArtists={artists} />
}

