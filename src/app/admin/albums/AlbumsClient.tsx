"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { deleteAlbum } from "@/features/albums/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { StateBadge } from "@/components/admin/StateBadge"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Label = {
  id: string
  name: string
}

type Album = {
  id: string
  title: string
  slug: string
  catalog_number: string | null
  cover_image_url: string | null
  release_date: string | null
  label_id: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
  labels: Label | null
}

type AlbumsClientProps = {
  initialAlbums: Album[]
}

export function AlbumsClient({ initialAlbums }: AlbumsClientProps) {
  const router = useRouter()
  const [albums, setAlbums] = useState<Album[]>(initialAlbums)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      await deleteAlbum(id)
      toast.success("Album deleted successfully")
      setAlbums(albums.filter(a => a.id !== id))
    } catch (error) {
      console.error("Error deleting album:", error)
      toast.error("Failed to delete album")
      throw error
    }
  }

  const filteredAlbums = albums.filter((album) => {
    const query = searchQuery.toLowerCase()
    return (
      album.title.toLowerCase().includes(query) ||
      album.catalog_number?.toLowerCase().includes(query) ||
      album.labels?.name.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <AdminPageTitle title="Albums" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search albums..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/albums/new/edit")}>
            New Album
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Title</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Release Date</TableHead>
            <TableHead>Publish Status</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlbums.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {searchQuery ? "No albums found matching your search" : "No albums found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredAlbums.map((album) => (
              <TableRow key={album.id}>
                <TableTitleCell 
                  title={album.title}
                  imageUrl={album.cover_image_url}
                  showInitials={true}
                  metadata={album.catalog_number || undefined}
                  href={`/dev/albums/${album.slug}`}
                  className="pl-4"
                />
                <TableCell>
                  {album.labels?.name || "-"}
                </TableCell>
                <TableCell>
                  {album.release_date
                    ? format(new Date(album.release_date), "MMM d, yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <StateBadge state={album.publish_status} />
                </TableCell>
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={album.id}
                    editHref={`/admin/albums/${album.slug}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`album "${album.title}"`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </AdminTable>
      </div>
    </div>
  )
}

