"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { deleteUpdate } from "@/features/updates/mutations"
import { AdminTable, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/admin/AdminTable"
import { TableTitleCell } from "@/components/admin/TableTitleCell"
import { ActionMenu } from "@/components/admin/ActionMenu"
import { StateBadge } from "@/components/admin/StateBadge"
import { AdminPageTitle } from "@/components/admin/AdminPageTitle"
import { AdminToolbar } from "@/components/admin/AdminToolbar"
import { AdminButton } from "@/components/admin/AdminButton"
import { faPlus } from "@fortawesome/free-solid-svg-icons"
import { toast } from "sonner"

type Update = {
  id: string
  title: string
  slug: string
  subtitle: string | null
  date: string | null
  publish_status: "draft" | "scheduled" | "published" | "archived"
  image_url: string | null
}

type UpdatesClientProps = {
  initialUpdates: Update[]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function UpdatesClient({ initialUpdates }: UpdatesClientProps) {
  const router = useRouter()
  const [updates, setUpdates] = useState<Update[]>(initialUpdates)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDelete = async (id: string) => {
    try {
      await deleteUpdate(id)
      toast.success("Update deleted successfully")
      setUpdates(updates.filter(u => u.id !== id))
    } catch (error) {
      console.error("Error deleting update:", error)
      toast.error("Failed to delete update")
      throw error
    }
  }

  const filteredUpdates = updates.filter((update) => {
    const query = searchQuery.toLowerCase()
    return (
      update.title.toLowerCase().includes(query) ||
      update.subtitle?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="w-full">
      <AdminPageTitle title="Updates" />
      <div className="space-y-4 mt-6">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search updates..."
        >
          <AdminButton icon={faPlus} onClick={() => router.push("/admin/updates/new/edit")}>
            New Update
          </AdminButton>
        </AdminToolbar>

        <AdminTable>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 w-[60%]">Title</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Publish Status</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredUpdates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {searchQuery ? "No updates found matching your search" : "No updates found"}
              </TableCell>
            </TableRow>
          ) : (
            filteredUpdates.map((update) => (
              <TableRow key={update.id}>
                <TableTitleCell 
                  title={update.title}
                  imageUrl={update.image_url}
                  description={update.subtitle || undefined}
                  showInitials={true}
                  href={`/dev/updates/${update.slug || generateSlug(update.title)}`}
                  className="pl-4 w-[60%]"
                />
                <TableCell>
                  {update.date
                    ? format(new Date(update.date), "MMM d, yyyy")
                    : "-"}
                </TableCell>
                <TableCell>
                  <StateBadge state={update.publish_status} />
                </TableCell>
                <TableCell className="text-right pr-4">
                  <ActionMenu
                    itemId={update.id}
                    editHref={`/admin/updates/${update.slug || generateSlug(update.title)}/edit`}
                    onDelete={handleDelete}
                    deleteLabel={`update "${update.title}"`}
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

