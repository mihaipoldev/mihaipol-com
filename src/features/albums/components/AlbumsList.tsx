"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { deleteAlbum } from "@/features/albums/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { CoverImageCell } from "@/components/admin/CoverImageCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { StateBadge } from "@/components/admin/StateBadge"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { Button } from "@/components/ui/button"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"
import type { Album } from "@/features/albums/types"

type AlbumsListProps = {
  initialAlbums: Album[]
}

export function AlbumsList({ initialAlbums }: AlbumsListProps) {
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
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-primary/20 via-primary/10 to-transparent rounded-full" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 mb-2">
            <h1 className="text-4xl font-bold text-foreground leading-none">Albums</h1>
            <span className="inline-flex items-center justify-center h-5 px-2.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 leading-none">
              ({filteredAlbums.length} {filteredAlbums.length === 1 ? 'album' : 'albums'})
            </span>
          </div>
          <p className="text-base text-muted-foreground">
            Manage your music albums, including releases, track listings, and metadata.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search albums..."
        >
          <Button 
            onClick={() => router.push("/admin/albums/new/edit")}
            className="rounded-full w-10 h-10 p-0 bg-transparent text-muted-foreground hover:text-primary hover:bg-transparent border-0 shadow-none transition-colors"
            title="New Album"
            variant="ghost"
          >
            <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          </Button>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 w-24">Cover</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Catalog</TableHead>
            <TableHead>Label</TableHead>
            <TableHead>Release Date</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAlbums.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
                {searchQuery ? "No albums found matching your search" : "No albums found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredAlbums.map((album) => (
              <TableRow 
                key={album.id}
                onClick={() => router.push(`/admin/albums/${album.slug}/edit`)}
                className="group cursor-pointer hover:bg-muted/50"
              >
                <CoverImageCell
                  imageUrl={album.cover_image_url}
                  title={album.title}
                  showInitials={true}
                  className="pl-4"
                />
                <TableTitleCell 
                  title={album.title}
                  imageUrl={undefined}
                  showInitials={false}
                  href={`/dev/albums/${album.slug}`}
                />
                <TableCell className="text-muted-foreground">
                  {album.catalog_number || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {album.labels?.name || "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">
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
                    openPageHref={`/dev/albums/${album.slug}`}
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


