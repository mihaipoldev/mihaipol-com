import { redirect } from "next/navigation"
import { getAlbumBySlugAdmin, getAlbumLinks } from "@/features/albums/data"
import { getAllLabels } from "@/features/labels/data"
import { getAllPlatforms } from "@/features/smart-links/platforms/data"
import { EditAlbumForm } from "@/features/albums/components/EditAlbumForm"

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ slug: string }>
}

export default async function EditAlbumPage({ params }: PageProps) {
  const { slug } = await params
  const isNew = slug === "new"

  // Fetch album first, then fetch related data
  const album = isNew ? null : await getAlbumBySlugAdmin(slug)
  
  // Fetch all other data in parallel
  const [links, labels, platforms] = await Promise.all([
    isNew || !album ? Promise.resolve([]) : getAlbumLinks(album.id),
    getAllLabels(),
    getAllPlatforms(),
  ])

  // If editing and album not found, redirect
  if (!isNew && !album) {
    redirect("/admin/albums")
  }

  return (
    <EditAlbumForm
      id={album?.id || "new"}
      isNew={isNew}
      initialAlbum={album}
      initialLinks={links}
      labels={labels}
      platforms={platforms}
    />
  )
}

