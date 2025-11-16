"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { deleteRelease } from "@/features/releases/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Release = {
  id: string
  title: string
  // Add more fields when releases table is created
}

type ReleasesClientProps = {
  initialReleases: Release[]
}

export function ReleasesClient({ initialReleases }: ReleasesClientProps) {
  const router = useRouter()
  const [releases, setReleases] = useState<Release[]>(initialReleases)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      await deleteRelease(id)
      toast.success("Release deleted successfully")
      setReleases(releases.filter(r => r.id !== id))
    } catch (error) {
      console.error("Error deleting release:", error)
      toast.error("Failed to delete release")
      throw error
    }
  }

  const filteredReleases = releases.filter((release) => {
    const query = searchQuery.toLowerCase()
    return (
      release.title?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <AdminPageTitle title="Releases" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search releases..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/releases/new/edit")}>
            New Release
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Title</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredReleases.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-muted-foreground">
                {searchQuery ? "No releases found matching your search" : "No releases found. Create a releases table in the database to get started."}
              </TableCell>
            </TableRow>
          ) : (
            filteredReleases.map((release) => (
              <TableRow key={release.id}>
                <TableTitleCell 
                  title={release.title}
                  className="pl-4"
                />
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={release.id}
                    editHref={`/admin/releases/${release.id}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`release "${release.title}"`}
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

