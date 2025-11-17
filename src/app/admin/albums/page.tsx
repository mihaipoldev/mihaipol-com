import { getAllAlbumsWithLabels } from "@/features/albums/data"
import { AlbumsList } from "@/features/albums/components/AlbumsList"

export const dynamic = 'force-dynamic'

export default async function AlbumsPage() {
  const albums = await getAllAlbumsWithLabels()
  
  return <AlbumsList initialAlbums={albums} />
}

