import { getAllAlbumsWithLabels } from "@/features/albums/data"
import { AlbumsClient } from "./AlbumsClient"

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
  const albums = await getAllAlbumsWithLabels()
  
  return <AlbumsClient initialAlbums={albums} />
}

