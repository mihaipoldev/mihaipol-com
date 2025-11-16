"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Artist = {
  id: string
  name: string
  slug: string
  profile_image_url: string | null
  city: string | null
  country: string | null
}

type ArtistsClientProps = {
  initialArtists: Artist[]
}

export function ArtistsClient({ initialArtists }: ArtistsClientProps) {
  const router = useRouter()
  const [artists, setArtists] = useState<Artist[]>(initialArtists)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/artists?id=${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete artist")
      }
      
      toast.success("Artist deleted successfully")
      setArtists(artists.filter(a => a.id !== id))
    } catch (error: any) {
      console.error("Error deleting artist:", error)
      toast.error(error.message || "Failed to delete artist")
      throw error
    }
  }

  const filteredArtists = artists.filter((artist) => {
    const query = searchQuery.toLowerCase()
    return (
      artist.name.toLowerCase().includes(query) ||
      artist.city?.toLowerCase().includes(query) ||
      artist.country?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <AdminPageTitle title="Artists" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search artists..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/artists/new/edit")}>
            New Artist
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Name</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredArtists.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                {searchQuery ? "No artists found matching your search" : "No artists found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredArtists.map((artist) => {
              return (
              <TableRow key={artist.id}>
                <TableTitleCell 
                  title={artist.name}
                  imageUrl={artist.profile_image_url}
                  showInitials={true}
                  className="pl-4"
                />
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={artist.id}
                    editHref={`/admin/artists/${artist.slug}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`artist "${artist.name}"`}
                  />
                </TableCell>
              </TableRow>
              )
            })
          )}
        </TableBody>
      </AdminTable>
      </div>
    </div>
  )
}

